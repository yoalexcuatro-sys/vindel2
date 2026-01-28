import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { PromotionPlan } from './promotion-service';

// Datos de la empresa emisora (Vindu)
export const COMPANY_INFO = {
  name: 'Vindu S.R.L.',
  cui: 'RO12345678',
  regCom: 'J40/1234/2024',
  address: 'Str. Exemplu nr. 10, București, România',
  email: 'facturi@vindu.ro',
  phone: '+40 700 000 000',
  bank: 'Banca Transilvania',
  iban: 'RO49AAAA1B31007593840000',
  capital: '200 RON'
};

// Tipos de factura
export interface Invoice {
  id: string;
  seriesNumber: string; // VND-2026-00001
  userId: string;
  
  // Datos del cliente
  clientType: 'personal' | 'business';
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone?: string;
  // Solo para empresas
  clientCui?: string;
  clientRegCom?: string;
  clientCity?: string;
  clientCounty?: string;
  clientPostalCode?: string;
  clientCountry?: string;
  clientRepresentative?: string;
  clientWebsite?: string;
  
  // Detalles de la factura
  items: InvoiceItem[];
  subtotal: number; // Sin IVA
  vatRate: number; // 19% en Rumanía
  vatAmount: number;
  total: number;
  currency: 'EUR';
  
  // Fechas
  issuedAt: Timestamp;
  dueDate: Timestamp;
  
  // Estado
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod: 'card' | 'transfer' | 'cash';
  
  // Referencia
  promotionId?: string;
  productId?: string;
  productTitle?: string;
  
  createdAt: Timestamp;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // Sin IVA
  totalPrice: number; // Sin IVA
}

// Generar número de serie único
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VND-${year}`;
  
  // Obtener el último número de factura del año
  const invoicesRef = collection(db, 'invoices');
  const q = query(
    invoicesRef,
    where('seriesNumber', '>=', prefix),
    where('seriesNumber', '<=', prefix + '\uf8ff'),
    orderBy('seriesNumber', 'desc')
  );
  
  const snapshot = await getDocs(q);
  
  let nextNumber = 1;
  if (!snapshot.empty) {
    const lastInvoice = snapshot.docs[0].data();
    const lastNumber = parseInt(lastInvoice.seriesNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
}

// Crear factura para una promoción
export async function createPromotionInvoice(
  userId: string,
  userProfile: {
    displayName?: string;
    email?: string;
    phone?: string;
    address?: string;
    accountType?: 'personal' | 'business';
    businessName?: string;
    cui?: string;
    regCom?: string;
    // Datos adicionales de empresa
    nrRegistruComert?: string;
    adresaSediu?: string;
    oras?: string;
    judet?: string;
    codPostal?: string;
    tara?: string;
    reprezentantLegal?: string;
    telefonFirma?: string;
    emailFirma?: string;
    website?: string;
  },
  plan: PromotionPlan,
  productId: string,
  productTitle: string,
  paymentMethod: 'card' | 'transfer' | 'cash' = 'card'
): Promise<Invoice> {
  const seriesNumber = await generateInvoiceNumber();
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const isBusinessClient = userProfile.accountType === 'business';
  
  // Calcular precios (el precio ya incluye IVA, así que calculamos al revés)
  // En Rumanía, IVA es 19%
  const vatRate = 19;
  const totalWithVat = plan.price;
  const subtotal = Number((totalWithVat / 1.19).toFixed(2));
  const vatAmount = Number((totalWithVat - subtotal).toFixed(2));
  
  const now = Timestamp.now();
  const dueDate = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 días
  
  // Construir dirección completa para empresas
  const buildBusinessAddress = () => {
    const parts = [];
    if (userProfile.adresaSediu) parts.push(userProfile.adresaSediu);
    if (userProfile.oras) parts.push(userProfile.oras);
    if (userProfile.judet) parts.push(`Jud. ${userProfile.judet}`);
    if (userProfile.codPostal) parts.push(`Cod poștal: ${userProfile.codPostal}`);
    if (userProfile.tara) parts.push(userProfile.tara);
    return parts.length > 0 ? parts.join(', ') : (userProfile.address || 'România');
  };

  // Construir objeto base de la factura (sin campos undefined)
  const invoiceData: Record<string, any> = {
    id: invoiceId,
    seriesNumber,
    userId,
    
    clientType: isBusinessClient ? 'business' : 'personal',
    clientName: isBusinessClient ? (userProfile.businessName || userProfile.displayName || 'Client') : (userProfile.displayName || 'Client'),
    clientAddress: isBusinessClient ? buildBusinessAddress() : (userProfile.address || 'România'),
    clientEmail: isBusinessClient ? (userProfile.emailFirma || userProfile.email || '') : (userProfile.email || ''),
    
    items: [{
      description: `Serviciu promovare anunț "${productTitle}" - Plan ${plan.name} (${plan.duration} zile)`,
      quantity: 1,
      unitPrice: subtotal,
      totalPrice: subtotal
    }],
    
    subtotal,
    vatRate,
    vatAmount,
    total: totalWithVat,
    currency: 'EUR',
    
    issuedAt: now,
    dueDate,
    
    status: 'paid', // Se marca como plătită al crear (asumimos pago exitoso)
    paymentMethod,
    
    promotionId: plan.id,
    productId,
    productTitle,
    
    createdAt: now
  };
  
  // Solo agregar campos opcionales si tienen valor
  if (isBusinessClient && userProfile.telefonFirma) {
    invoiceData.clientPhone = userProfile.telefonFirma;
  } else if (userProfile.phone) {
    invoiceData.clientPhone = userProfile.phone;
  }
  if (isBusinessClient && userProfile.cui) {
    invoiceData.clientCui = userProfile.cui;
  }
  if (isBusinessClient && (userProfile.nrRegistruComert || userProfile.regCom)) {
    invoiceData.clientRegCom = userProfile.nrRegistruComert || userProfile.regCom;
  }
  if (isBusinessClient && userProfile.oras) {
    invoiceData.clientCity = userProfile.oras;
  }
  if (isBusinessClient && userProfile.judet) {
    invoiceData.clientCounty = userProfile.judet;
  }
  if (isBusinessClient && userProfile.codPostal) {
    invoiceData.clientPostalCode = userProfile.codPostal;
  }
  if (isBusinessClient && userProfile.tara) {
    invoiceData.clientCountry = userProfile.tara;
  }
  if (isBusinessClient && userProfile.reprezentantLegal) {
    invoiceData.clientRepresentative = userProfile.reprezentantLegal;
  }
  if (isBusinessClient && userProfile.website) {
    invoiceData.clientWebsite = userProfile.website;
  }
  
  const invoice = invoiceData as Invoice;
  
  // Guardar en Firestore
  await setDoc(doc(db, 'invoices', invoiceId), invoiceData);
  
  return invoice;
}

// Obtener facturas de un usuario
export async function getUserInvoices(userId: string): Promise<Invoice[]> {
  const invoicesRef = collection(db, 'invoices');
  // Consulta simple sin orderBy para evitar necesidad de índice compuesto
  const q = query(
    invoicesRef,
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  const invoices = snapshot.docs.map(doc => doc.data() as Invoice);
  
  // Ordenar en el cliente por createdAt descendente
  return invoices.sort((a, b) => {
    const aTime = a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt 
      ? (a.createdAt as any).seconds 
      : 0;
    const bTime = b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt 
      ? (b.createdAt as any).seconds 
      : 0;
    return bTime - aTime; // Descendente
  });
}

// Obtener una factura por ID
export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const docRef = doc(db, 'invoices', invoiceId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as Invoice;
  }
  return null;
}

// Generar HTML de la factura para imprimir/PDF
export function generateInvoiceHTML(invoice: Invoice): string {
  const issuedDate = invoice.issuedAt instanceof Timestamp 
    ? invoice.issuedAt.toDate() 
    : new Date((invoice.issuedAt as any).seconds * 1000);
  
  const dueDate = invoice.dueDate instanceof Timestamp 
    ? invoice.dueDate.toDate() 
    : new Date((invoice.dueDate as any).seconds * 1000);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} EUR`;
  };

  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factură ${invoice.seriesNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #13C1AC;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      color: #13C1AC;
    }
    .logo span {
      font-weight: 300;
      opacity: 0.7;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 28px;
      color: #333;
      margin-bottom: 5px;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
    }
    .invoice-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 8px;
    }
    .status-paid {
      background: #d1fae5;
      color: #059669;
    }
    .status-pending {
      background: #fef3c7;
      color: #d97706;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .party {
      width: 48%;
    }
    .party-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      margin-bottom: 8px;
    }
    .party-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    .party-details {
      color: #666;
      font-size: 11px;
    }
    .party-details p {
      margin-bottom: 3px;
    }
    .dates {
      display: flex;
      gap: 40px;
      margin-bottom: 30px;
      padding: 15px 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .date-item label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
      display: block;
      margin-bottom: 4px;
    }
    .date-item span {
      font-weight: 600;
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #13C1AC;
      color: #fff;
      padding: 12px 15px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:last-child, td:last-child {
      text-align: right;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 280px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .totals-row.total {
      border-bottom: none;
      border-top: 2px solid #13C1AC;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 16px;
      font-weight: 700;
      color: #13C1AC;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
    }
    .payment-info {
      width: 48%;
    }
    .payment-info h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #888;
      margin-bottom: 10px;
    }
    .payment-info p {
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
    }
    .notes {
      width: 48%;
      text-align: right;
    }
    .notes p {
      font-size: 11px;
      color: #888;
      font-style: italic;
    }
    .legal {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 10px;
      color: #888;
    }
    @media print {
      body {
        padding: 20px;
      }
      .invoice {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">Vindu<span>.ro</span></div>
      <div class="invoice-title">
        <h1>FACTURĂ</h1>
        <div class="invoice-number">${invoice.seriesNumber}</div>
        <div class="invoice-status ${invoice.status === 'paid' ? 'status-paid' : 'status-pending'}">
          ${invoice.status === 'paid' ? 'PLĂTITĂ' : invoice.status === 'pending' ? 'ÎN AȘTEPTARE' : 'ANULATĂ'}
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Furnizor</div>
        <div class="party-name">${COMPANY_INFO.name}</div>
        <div class="party-details">
          <p>CUI: ${COMPANY_INFO.cui}</p>
          <p>Reg. Com.: ${COMPANY_INFO.regCom}</p>
          <p>${COMPANY_INFO.address}</p>
          <p>Email: ${COMPANY_INFO.email}</p>
          <p>Tel: ${COMPANY_INFO.phone}</p>
        </div>
      </div>
      <div class="party">
        <div class="party-label">Client${invoice.clientType === 'business' ? ' (Persoană Juridică)' : ' (Persoană Fizică)'}</div>
        <div class="party-name">${invoice.clientName}</div>
        <div class="party-details">
          ${invoice.clientType === 'business' && invoice.clientCui ? `<p><strong>CUI:</strong> ${invoice.clientCui}</p>` : ''}
          ${invoice.clientType === 'business' && invoice.clientRegCom ? `<p><strong>Reg. Com.:</strong> ${invoice.clientRegCom}</p>` : ''}
          ${invoice.clientType === 'business' && invoice.clientRepresentative ? `<p><strong>Reprezentant:</strong> ${invoice.clientRepresentative}</p>` : ''}
          <p>${invoice.clientAddress}</p>
          <p><strong>Email:</strong> ${invoice.clientEmail}</p>
          ${invoice.clientPhone ? `<p><strong>Tel:</strong> ${invoice.clientPhone}</p>` : ''}
          ${invoice.clientType === 'business' && invoice.clientWebsite ? `<p><strong>Website:</strong> ${invoice.clientWebsite}</p>` : ''}
        </div>
      </div>
    </div>

    <div class="dates">
      <div class="date-item">
        <label>Data emiterii</label>
        <span>${formatDate(issuedDate)}</span>
      </div>
      <div class="date-item">
        <label>Data scadenței</label>
        <span>${formatDate(dueDate)}</span>
      </div>
      <div class="date-item">
        <label>Metodă de plată</label>
        <span>${invoice.paymentMethod === 'card' ? 'Card bancar' : invoice.paymentMethod === 'transfer' ? 'Transfer bancar' : 'Numerar'}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 50%">Descriere</th>
          <th style="width: 15%">Cantitate</th>
          <th style="width: 17%">Preț unitar</th>
          <th style="width: 18%">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(item => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.totalPrice)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-table">
        <div class="totals-row">
          <span>Subtotal (fără TVA)</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>TVA (${invoice.vatRate}%)</span>
          <span>${formatCurrency(invoice.vatAmount)}</span>
        </div>
        <div class="totals-row total">
          <span>TOTAL</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="payment-info">
        <h4>Detalii bancare</h4>
        <p><strong>Bancă:</strong> ${COMPANY_INFO.bank}</p>
        <p><strong>IBAN:</strong> ${COMPANY_INFO.iban}</p>
        <p><strong>Beneficiar:</strong> ${COMPANY_INFO.name}</p>
      </div>
      <div class="notes">
        <p>Vă mulțumim pentru încredere!</p>
        <p>Pentru întrebări: ${COMPANY_INFO.email}</p>
      </div>
    </div>

    <div class="legal">
      <p>${COMPANY_INFO.name} | ${COMPANY_INFO.cui} | ${COMPANY_INFO.regCom}</p>
      <p>Capital social: ${COMPANY_INFO.capital} | ${COMPANY_INFO.address}</p>
      <p>Această factură a fost generată electronic și este valabilă fără semnătură și ștampilă conform art. 319 alin. 29 din Legea nr. 227/2015.</p>
    </div>
  </div>
</body>
</html>
`;
}

// Abrir factura en nueva ventana para imprimir/guardar como PDF
export function printInvoice(invoice: Invoice): void {
  const html = generateInvoiceHTML(invoice);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Auto-imprimir después de cargar
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// Descargar factura como HTML (el usuario puede guardar como PDF desde el navegador)
export function downloadInvoice(invoice: Invoice): void {
  const html = generateInvoiceHTML(invoice);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Factura-${invoice.seriesNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
