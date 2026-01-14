export interface Localidad {
  ciudad: string;
  judet: string;
}

export const localidades: Localidad[] = [
  // București y sectores
  { ciudad: 'București', judet: 'București' },
  { ciudad: 'Sector 1', judet: 'București' },
  { ciudad: 'Sector 2', judet: 'București' },
  { ciudad: 'Sector 3', judet: 'București' },
  { ciudad: 'Sector 4', judet: 'București' },
  { ciudad: 'Sector 5', judet: 'București' },
  { ciudad: 'Sector 6', judet: 'București' },
  
  // Alba
  { ciudad: 'Alba Iulia', judet: 'Alba' },
  { ciudad: 'Aiud', judet: 'Alba' },
  { ciudad: 'Blaj', judet: 'Alba' },
  { ciudad: 'Sebeș', judet: 'Alba' },
  { ciudad: 'Cugir', judet: 'Alba' },
  { ciudad: 'Ocna Mureș', judet: 'Alba' },
  { ciudad: 'Zlatna', judet: 'Alba' },
  { ciudad: 'Câmpeni', judet: 'Alba' },
  { ciudad: 'Teiuș', judet: 'Alba' },
  { ciudad: 'Abrud', judet: 'Alba' },
  
  // Arad
  { ciudad: 'Arad', judet: 'Arad' },
  { ciudad: 'Ineu', judet: 'Arad' },
  { ciudad: 'Lipova', judet: 'Arad' },
  { ciudad: 'Pâncota', judet: 'Arad' },
  { ciudad: 'Curtici', judet: 'Arad' },
  { ciudad: 'Chișineu-Criș', judet: 'Arad' },
  { ciudad: 'Nădlac', judet: 'Arad' },
  { ciudad: 'Pecica', judet: 'Arad' },
  { ciudad: 'Sântana', judet: 'Arad' },
  { ciudad: 'Sebiș', judet: 'Arad' },
  
  // Argeș
  { ciudad: 'Pitești', judet: 'Argeș' },
  { ciudad: 'Câmpulung', judet: 'Argeș' },
  { ciudad: 'Curtea de Argeș', judet: 'Argeș' },
  { ciudad: 'Mioveni', judet: 'Argeș' },
  { ciudad: 'Costești', judet: 'Argeș' },
  { ciudad: 'Topoloveni', judet: 'Argeș' },
  { ciudad: 'Ștefănești', judet: 'Argeș' },
  
  // Bacău
  { ciudad: 'Bacău', judet: 'Bacău' },
  { ciudad: 'Onești', judet: 'Bacău' },
  { ciudad: 'Moinești', judet: 'Bacău' },
  { ciudad: 'Comănești', judet: 'Bacău' },
  { ciudad: 'Buhuși', judet: 'Bacău' },
  { ciudad: 'Dărmănești', judet: 'Bacău' },
  { ciudad: 'Târgu Ocna', judet: 'Bacău' },
  { ciudad: 'Slănic-Moldova', judet: 'Bacău' },
  
  // Bihor
  { ciudad: 'Oradea', judet: 'Bihor' },
  { ciudad: 'Salonta', judet: 'Bihor' },
  { ciudad: 'Marghita', judet: 'Bihor' },
  { ciudad: 'Beiuș', judet: 'Bihor' },
  { ciudad: 'Aleșd', judet: 'Bihor' },
  { ciudad: 'Ștei', judet: 'Bihor' },
  { ciudad: 'Valea lui Mihai', judet: 'Bihor' },
  { ciudad: 'Nucet', judet: 'Bihor' },
  { ciudad: 'Săcueni', judet: 'Bihor' },
  { ciudad: 'Băile Felix', judet: 'Bihor' },
  { ciudad: 'Băile 1 Mai', judet: 'Bihor' },
  
  // Bistrița-Năsăud
  { ciudad: 'Bistrița', judet: 'Bistrița-Năsăud' },
  { ciudad: 'Năsăud', judet: 'Bistrița-Năsăud' },
  { ciudad: 'Beclean', judet: 'Bistrița-Năsăud' },
  { ciudad: 'Sângeorz-Băi', judet: 'Bistrița-Năsăud' },
  
  // Botoșani
  { ciudad: 'Botoșani', judet: 'Botoșani' },
  { ciudad: 'Dorohoi', judet: 'Botoșani' },
  { ciudad: 'Darabani', judet: 'Botoșani' },
  { ciudad: 'Săveni', judet: 'Botoșani' },
  { ciudad: 'Flămânzi', judet: 'Botoșani' },
  { ciudad: 'Ștefănești', judet: 'Botoșani' },
  
  // Brăila
  { ciudad: 'Brăila', judet: 'Brăila' },
  { ciudad: 'Făurei', judet: 'Brăila' },
  { ciudad: 'Însurăței', judet: 'Brăila' },
  { ciudad: 'Ianca', judet: 'Brăila' },
  
  // Brașov
  { ciudad: 'Brașov', judet: 'Brașov' },
  { ciudad: 'Făgăraș', judet: 'Brașov' },
  { ciudad: 'Săcele', judet: 'Brașov' },
  { ciudad: 'Codlea', judet: 'Brașov' },
  { ciudad: 'Zărnești', judet: 'Brașov' },
  { ciudad: 'Râșnov', judet: 'Brașov' },
  { ciudad: 'Rupea', judet: 'Brașov' },
  { ciudad: 'Victoria', judet: 'Brașov' },
  { ciudad: 'Ghimbav', judet: 'Brașov' },
  { ciudad: 'Predeal', judet: 'Brașov' },
  { ciudad: 'Poiana Brașov', judet: 'Brașov' },
  { ciudad: 'Bran', judet: 'Brașov' },
  
  // Buzău
  { ciudad: 'Buzău', judet: 'Buzău' },
  { ciudad: 'Râmnicu Sărat', judet: 'Buzău' },
  { ciudad: 'Nehoiu', judet: 'Buzău' },
  { ciudad: 'Pogoanele', judet: 'Buzău' },
  { ciudad: 'Pătârlagele', judet: 'Buzău' },
  
  // Călărași
  { ciudad: 'Călărași', judet: 'Călărași' },
  { ciudad: 'Oltenița', judet: 'Călărași' },
  { ciudad: 'Budești', judet: 'Călărași' },
  { ciudad: 'Fundulea', judet: 'Călărași' },
  { ciudad: 'Lehliu Gară', judet: 'Călărași' },
  
  // Caraș-Severin
  { ciudad: 'Reșița', judet: 'Caraș-Severin' },
  { ciudad: 'Caransebeș', judet: 'Caraș-Severin' },
  { ciudad: 'Bocșa', judet: 'Caraș-Severin' },
  { ciudad: 'Moldova Nouă', judet: 'Caraș-Severin' },
  { ciudad: 'Oravița', judet: 'Caraș-Severin' },
  { ciudad: 'Anina', judet: 'Caraș-Severin' },
  { ciudad: 'Băile Herculane', judet: 'Caraș-Severin' },
  { ciudad: 'Oțelu Roșu', judet: 'Caraș-Severin' },
  
  // Cluj
  { ciudad: 'Cluj-Napoca', judet: 'Cluj' },
  { ciudad: 'Turda', judet: 'Cluj' },
  { ciudad: 'Dej', judet: 'Cluj' },
  { ciudad: 'Câmpia Turzii', judet: 'Cluj' },
  { ciudad: 'Gherla', judet: 'Cluj' },
  { ciudad: 'Huedin', judet: 'Cluj' },
  { ciudad: 'Florești', judet: 'Cluj' },
  { ciudad: 'Baciu', judet: 'Cluj' },
  { ciudad: 'Apahida', judet: 'Cluj' },
  { ciudad: 'Gilău', judet: 'Cluj' },
  
  // Constanța
  { ciudad: 'Constanța', judet: 'Constanța' },
  { ciudad: 'Mangalia', judet: 'Constanța' },
  { ciudad: 'Medgidia', judet: 'Constanța' },
  { ciudad: 'Năvodari', judet: 'Constanța' },
  { ciudad: 'Cernavodă', judet: 'Constanța' },
  { ciudad: 'Ovidiu', judet: 'Constanța' },
  { ciudad: 'Eforie Nord', judet: 'Constanța' },
  { ciudad: 'Eforie Sud', judet: 'Constanța' },
  { ciudad: 'Mamaia', judet: 'Constanța' },
  { ciudad: 'Neptun', judet: 'Constanța' },
  { ciudad: 'Jupiter', judet: 'Constanța' },
  { ciudad: 'Venus', judet: 'Constanța' },
  { ciudad: 'Saturn', judet: 'Constanța' },
  { ciudad: 'Costinești', judet: 'Constanța' },
  { ciudad: 'Vama Veche', judet: 'Constanța' },
  { ciudad: '2 Mai', judet: 'Constanța' },
  { ciudad: 'Techirghiol', judet: 'Constanța' },
  
  // Covasna
  { ciudad: 'Sfântu Gheorghe', judet: 'Covasna' },
  { ciudad: 'Târgu Secuiesc', judet: 'Covasna' },
  { ciudad: 'Covasna', judet: 'Covasna' },
  { ciudad: 'Baraolt', judet: 'Covasna' },
  
  // Dâmbovița
  { ciudad: 'Târgoviște', judet: 'Dâmbovița' },
  { ciudad: 'Moreni', judet: 'Dâmbovița' },
  { ciudad: 'Pucioasa', judet: 'Dâmbovița' },
  { ciudad: 'Găești', judet: 'Dâmbovița' },
  { ciudad: 'Titu', judet: 'Dâmbovița' },
  { ciudad: 'Fieni', judet: 'Dâmbovița' },
  
  // Dolj
  { ciudad: 'Craiova', judet: 'Dolj' },
  { ciudad: 'Băilești', judet: 'Dolj' },
  { ciudad: 'Calafat', judet: 'Dolj' },
  { ciudad: 'Filiași', judet: 'Dolj' },
  { ciudad: 'Segarcea', judet: 'Dolj' },
  { ciudad: 'Bechet', judet: 'Dolj' },
  
  // Galați
  { ciudad: 'Galați', judet: 'Galați' },
  { ciudad: 'Tecuci', judet: 'Galați' },
  { ciudad: 'Târgu Bujor', judet: 'Galați' },
  { ciudad: 'Berești', judet: 'Galați' },
  
  // Giurgiu
  { ciudad: 'Giurgiu', judet: 'Giurgiu' },
  { ciudad: 'Bolintin-Vale', judet: 'Giurgiu' },
  { ciudad: 'Mihăilești', judet: 'Giurgiu' },
  
  // Gorj
  { ciudad: 'Târgu Jiu', judet: 'Gorj' },
  { ciudad: 'Motru', judet: 'Gorj' },
  { ciudad: 'Rovinari', judet: 'Gorj' },
  { ciudad: 'Bumbești-Jiu', judet: 'Gorj' },
  { ciudad: 'Novaci', judet: 'Gorj' },
  
  // Harghita
  { ciudad: 'Miercurea Ciuc', judet: 'Harghita' },
  { ciudad: 'Odorheiu Secuiesc', judet: 'Harghita' },
  { ciudad: 'Gheorgheni', judet: 'Harghita' },
  { ciudad: 'Toplița', judet: 'Harghita' },
  { ciudad: 'Cristuru Secuiesc', judet: 'Harghita' },
  { ciudad: 'Băile Tușnad', judet: 'Harghita' },
  
  // Hunedoara
  { ciudad: 'Deva', judet: 'Hunedoara' },
  { ciudad: 'Hunedoara', judet: 'Hunedoara' },
  { ciudad: 'Petroșani', judet: 'Hunedoara' },
  { ciudad: 'Lupeni', judet: 'Hunedoara' },
  { ciudad: 'Vulcan', judet: 'Hunedoara' },
  { ciudad: 'Brad', judet: 'Hunedoara' },
  { ciudad: 'Orăștie', judet: 'Hunedoara' },
  { ciudad: 'Petrila', judet: 'Hunedoara' },
  { ciudad: 'Simeria', judet: 'Hunedoara' },
  { ciudad: 'Hațeg', judet: 'Hunedoara' },
  
  // Ialomița
  { ciudad: 'Slobozia', judet: 'Ialomița' },
  { ciudad: 'Fetești', judet: 'Ialomița' },
  { ciudad: 'Urziceni', judet: 'Ialomița' },
  { ciudad: 'Țăndărei', judet: 'Ialomița' },
  { ciudad: 'Amara', judet: 'Ialomița' },
  
  // Iași
  { ciudad: 'Iași', judet: 'Iași' },
  { ciudad: 'Pașcani', judet: 'Iași' },
  { ciudad: 'Târgu Frumos', judet: 'Iași' },
  { ciudad: 'Hârlău', judet: 'Iași' },
  { ciudad: 'Podu Iloaiei', judet: 'Iași' },
  
  // Ilfov
  { ciudad: 'Voluntari', judet: 'Ilfov' },
  { ciudad: 'Pantelimon', judet: 'Ilfov' },
  { ciudad: 'Buftea', judet: 'Ilfov' },
  { ciudad: 'Popești-Leordeni', judet: 'Ilfov' },
  { ciudad: 'Bragadiru', judet: 'Ilfov' },
  { ciudad: 'Chitila', judet: 'Ilfov' },
  { ciudad: 'Măgurele', judet: 'Ilfov' },
  { ciudad: 'Otopeni', judet: 'Ilfov' },
  { ciudad: 'Snagov', judet: 'Ilfov' },
  { ciudad: 'Mogoșoaia', judet: 'Ilfov' },
  { ciudad: 'Chiajna', judet: 'Ilfov' },
  { ciudad: 'Tunari', judet: 'Ilfov' },
  { ciudad: '1 Decembrie', judet: 'Ilfov' },
  
  // Maramureș
  { ciudad: 'Baia Mare', judet: 'Maramureș' },
  { ciudad: 'Sighetu Marmației', judet: 'Maramureș' },
  { ciudad: 'Borșa', judet: 'Maramureș' },
  { ciudad: 'Vișeu de Sus', judet: 'Maramureș' },
  { ciudad: 'Baia Sprie', judet: 'Maramureș' },
  { ciudad: 'Târgu Lăpuș', judet: 'Maramureș' },
  { ciudad: 'Cavnic', judet: 'Maramureș' },
  { ciudad: 'Seini', judet: 'Maramureș' },
  
  // Mehedinți
  { ciudad: 'Drobeta-Turnu Severin', judet: 'Mehedinți' },
  { ciudad: 'Orșova', judet: 'Mehedinți' },
  { ciudad: 'Strehaia', judet: 'Mehedinți' },
  { ciudad: 'Vânju Mare', judet: 'Mehedinți' },
  
  // Mureș
  { ciudad: 'Târgu Mureș', judet: 'Mureș' },
  { ciudad: 'Sighișoara', judet: 'Mureș' },
  { ciudad: 'Reghin', judet: 'Mureș' },
  { ciudad: 'Târnăveni', judet: 'Mureș' },
  { ciudad: 'Luduș', judet: 'Mureș' },
  { ciudad: 'Sovata', judet: 'Mureș' },
  
  // Neamț
  { ciudad: 'Piatra Neamț', judet: 'Neamț' },
  { ciudad: 'Roman', judet: 'Neamț' },
  { ciudad: 'Târgu Neamț', judet: 'Neamț' },
  { ciudad: 'Roznov', judet: 'Neamț' },
  { ciudad: 'Bicaz', judet: 'Neamț' },
  
  // Olt
  { ciudad: 'Slatina', judet: 'Olt' },
  { ciudad: 'Caracal', judet: 'Olt' },
  { ciudad: 'Balș', judet: 'Olt' },
  { ciudad: 'Corabia', judet: 'Olt' },
  { ciudad: 'Scornicești', judet: 'Olt' },
  
  // Prahova
  { ciudad: 'Ploiești', judet: 'Prahova' },
  { ciudad: 'Câmpina', judet: 'Prahova' },
  { ciudad: 'Băicoi', judet: 'Prahova' },
  { ciudad: 'Breaza', judet: 'Prahova' },
  { ciudad: 'Comarnic', judet: 'Prahova' },
  { ciudad: 'Mizil', judet: 'Prahova' },
  { ciudad: 'Sinaia', judet: 'Prahova' },
  { ciudad: 'Azuga', judet: 'Prahova' },
  { ciudad: 'Bușteni', judet: 'Prahova' },
  { ciudad: 'Vălenii de Munte', judet: 'Prahova' },
  { ciudad: 'Urlați', judet: 'Prahova' },
  { ciudad: 'Slănic', judet: 'Prahova' },
  
  // Satu Mare
  { ciudad: 'Satu Mare', judet: 'Satu Mare' },
  { ciudad: 'Carei', judet: 'Satu Mare' },
  { ciudad: 'Negrești-Oaș', judet: 'Satu Mare' },
  { ciudad: 'Tășnad', judet: 'Satu Mare' },
  { ciudad: 'Ardud', judet: 'Satu Mare' },
  
  // Sălaj
  { ciudad: 'Zalău', judet: 'Sălaj' },
  { ciudad: 'Șimleu Silvaniei', judet: 'Sălaj' },
  { ciudad: 'Jibou', judet: 'Sălaj' },
  { ciudad: 'Cehu Silvaniei', judet: 'Sălaj' },
  
  // Sibiu
  { ciudad: 'Sibiu', judet: 'Sibiu' },
  { ciudad: 'Mediaș', judet: 'Sibiu' },
  { ciudad: 'Cisnădie', judet: 'Sibiu' },
  { ciudad: 'Avrig', judet: 'Sibiu' },
  { ciudad: 'Agnita', judet: 'Sibiu' },
  { ciudad: 'Dumbrăveni', judet: 'Sibiu' },
  { ciudad: 'Copșa Mică', judet: 'Sibiu' },
  { ciudad: 'Păltiniș', judet: 'Sibiu' },
  
  // Suceava
  { ciudad: 'Suceava', judet: 'Suceava' },
  { ciudad: 'Fălticeni', judet: 'Suceava' },
  { ciudad: 'Rădăuți', judet: 'Suceava' },
  { ciudad: 'Câmpulung Moldovenesc', judet: 'Suceava' },
  { ciudad: 'Vatra Dornei', judet: 'Suceava' },
  { ciudad: 'Gura Humorului', judet: 'Suceava' },
  { ciudad: 'Siret', judet: 'Suceava' },
  
  // Teleorman
  { ciudad: 'Alexandria', judet: 'Teleorman' },
  { ciudad: 'Roșiori de Vede', judet: 'Teleorman' },
  { ciudad: 'Turnu Măgurele', judet: 'Teleorman' },
  { ciudad: 'Zimnicea', judet: 'Teleorman' },
  { ciudad: 'Videle', judet: 'Teleorman' },
  
  // Timiș
  { ciudad: 'Timișoara', judet: 'Timiș' },
  { ciudad: 'Lugoj', judet: 'Timiș' },
  { ciudad: 'Sânnicolau Mare', judet: 'Timiș' },
  { ciudad: 'Jimbolia', judet: 'Timiș' },
  { ciudad: 'Făget', judet: 'Timiș' },
  { ciudad: 'Buziaș', judet: 'Timiș' },
  { ciudad: 'Deta', judet: 'Timiș' },
  { ciudad: 'Recaș', judet: 'Timiș' },
  { ciudad: 'Gătaia', judet: 'Timiș' },
  
  // Tulcea
  { ciudad: 'Tulcea', judet: 'Tulcea' },
  { ciudad: 'Babadag', judet: 'Tulcea' },
  { ciudad: 'Măcin', judet: 'Tulcea' },
  { ciudad: 'Isaccea', judet: 'Tulcea' },
  { ciudad: 'Sulina', judet: 'Tulcea' },
  
  // Vaslui
  { ciudad: 'Vaslui', judet: 'Vaslui' },
  { ciudad: 'Bârlad', judet: 'Vaslui' },
  { ciudad: 'Huși', judet: 'Vaslui' },
  { ciudad: 'Negrești', judet: 'Vaslui' },
  { ciudad: 'Murgeni', judet: 'Vaslui' },
  
  // Vâlcea
  { ciudad: 'Râmnicu Vâlcea', judet: 'Vâlcea' },
  { ciudad: 'Drăgășani', judet: 'Vâlcea' },
  { ciudad: 'Băile Olănești', judet: 'Vâlcea' },
  { ciudad: 'Călimănești', judet: 'Vâlcea' },
  { ciudad: 'Brezoi', judet: 'Vâlcea' },
  { ciudad: 'Horezu', judet: 'Vâlcea' },
  { ciudad: 'Băile Govora', judet: 'Vâlcea' },
  { ciudad: 'Ocnele Mari', judet: 'Vâlcea' },
  { ciudad: 'Berbești', judet: 'Vâlcea' },
  
  // Vrancea
  { ciudad: 'Focșani', judet: 'Vrancea' },
  { ciudad: 'Adjud', judet: 'Vrancea' },
  { ciudad: 'Mărășești', judet: 'Vrancea' },
  { ciudad: 'Panciu', judet: 'Vrancea' },
  { ciudad: 'Odobești', judet: 'Vrancea' },
  
  // === LOCALIDADES ADICIONALES ===
  
  // Más localidades de Cluj
  { ciudad: 'Zorilor', judet: 'Cluj' },
  { ciudad: 'Mănăștur', judet: 'Cluj' },
  { ciudad: 'Gheorgheni', judet: 'Cluj' },
  { ciudad: 'Mărăști', judet: 'Cluj' },
  { ciudad: 'Bună Ziua', judet: 'Cluj' },
  { ciudad: 'Borhanci', judet: 'Cluj' },
  { ciudad: 'Sopor', judet: 'Cluj' },
  { ciudad: 'Feleacu', judet: 'Cluj' },
  
  // Más localidades de București/Ilfov
  { ciudad: 'Pipera', judet: 'București' },
  { ciudad: 'Drumul Taberei', judet: 'București' },
  { ciudad: 'Militari', judet: 'București' },
  { ciudad: 'Titan', judet: 'București' },
  { ciudad: 'Colentina', judet: 'București' },
  { ciudad: 'Rahova', judet: 'București' },
  { ciudad: 'Ferentari', judet: 'București' },
  { ciudad: 'Obor', judet: 'București' },
  { ciudad: 'Dristor', judet: 'București' },
  { ciudad: 'Tineretului', judet: 'București' },
  { ciudad: 'Unirii', judet: 'București' },
  { ciudad: 'Victoriei', judet: 'București' },
  { ciudad: 'Aviatorilor', judet: 'București' },
  { ciudad: 'Dorobanți', judet: 'București' },
  { ciudad: 'Floreasca', judet: 'București' },
  { ciudad: 'Primăverii', judet: 'București' },
  { ciudad: 'Herăstrău', judet: 'București' },
  { ciudad: 'Băneasa', judet: 'București' },
  { ciudad: 'Grivița', judet: 'București' },
  { ciudad: 'Crângași', judet: 'București' },
  { ciudad: 'Giulești', judet: 'București' },
  { ciudad: 'Cotroceni', judet: 'București' },
  { ciudad: 'Cișmigiu', judet: 'București' },
  { ciudad: 'Izvor', judet: 'București' },
  { ciudad: 'Văcărești', judet: 'București' },
  
  // Más localidades de Timiș
  { ciudad: 'Giroc', judet: 'Timiș' },
  { ciudad: 'Moșnița Nouă', judet: 'Timiș' },
  { ciudad: 'Dumbrăvița', judet: 'Timiș' },
  { ciudad: 'Ghiroda', judet: 'Timiș' },
  { ciudad: 'Sânandrei', judet: 'Timiș' },
  { ciudad: 'Săcălaz', judet: 'Timiș' },
  
  // Más localidades de Constanța
  { ciudad: 'Agigea', judet: 'Constanța' },
  { ciudad: 'Cumpăna', judet: 'Constanța' },
  { ciudad: 'Lumina', judet: 'Constanța' },
  { ciudad: 'Corbu', judet: 'Constanța' },
  { ciudad: 'Năvodari', judet: 'Constanța' },
  { ciudad: 'Poarta Albă', judet: 'Constanța' },
  { ciudad: 'Murfatlar', judet: 'Constanța' },
  { ciudad: 'Hârșova', judet: 'Constanța' },
  
  // Más localidades de Brașov
  { ciudad: 'Sânpetru', judet: 'Brașov' },
  { ciudad: 'Hărman', judet: 'Brașov' },
  { ciudad: 'Cristian', judet: 'Brașov' },
  { ciudad: 'Bod', judet: 'Brașov' },
  { ciudad: 'Prejmer', judet: 'Brașov' },
  { ciudad: 'Moieciu', judet: 'Brașov' },
  { ciudad: 'Vulcan', judet: 'Brașov' },
  
  // Más localidades de Sibiu
  { ciudad: 'Șelimbăr', judet: 'Sibiu' },
  { ciudad: 'Cristian', judet: 'Sibiu' },
  { ciudad: 'Tălmaciu', judet: 'Sibiu' },
  { ciudad: 'Ocna Sibiului', judet: 'Sibiu' },
  { ciudad: 'Șura Mică', judet: 'Sibiu' },
  
  // Más localidades de Iași
  { ciudad: 'Miroslava', judet: 'Iași' },
  { ciudad: 'Ciurea', judet: 'Iași' },
  { ciudad: 'Tomești', judet: 'Iași' },
  { ciudad: 'Rediu', judet: 'Iași' },
  { ciudad: 'Bârnova', judet: 'Iași' },
  { ciudad: 'Bucium', judet: 'Iași' },
  { ciudad: 'Copou', judet: 'Iași' },
  { ciudad: 'Tătărași', judet: 'Iași' },
  { ciudad: 'Nicolina', judet: 'Iași' },
  { ciudad: 'Podu Roș', judet: 'Iași' },
  { ciudad: 'Alexandru cel Bun', judet: 'Iași' },
  { ciudad: 'Dacia', judet: 'Iași' },
  
  // Más localidades de Dolj
  { ciudad: 'Malu Mare', judet: 'Dolj' },
  { ciudad: 'Podari', judet: 'Dolj' },
  { ciudad: 'Cârcea', judet: 'Dolj' },
  
  // Más localidades de Prahova
  { ciudad: 'Blejoi', judet: 'Prahova' },
  { ciudad: 'Bucov', judet: 'Prahova' },
  { ciudad: 'Strejnic', judet: 'Prahova' },
  { ciudad: 'Păulești', judet: 'Prahova' },
  
  // Más localidades de Arad
  { ciudad: 'Vladimirescu', judet: 'Arad' },
  { ciudad: 'Sântana', judet: 'Arad' },
  { ciudad: 'Felnac', judet: 'Arad' },
  { ciudad: 'Zimandu Nou', judet: 'Arad' },
  
  // Más localidades de Bihor
  { ciudad: 'Paleu', judet: 'Bihor' },
  { ciudad: 'Sânmartin', judet: 'Bihor' },
  { ciudad: 'Biharia', judet: 'Bihor' },
  { ciudad: 'Oșorhei', judet: 'Bihor' },
  { ciudad: 'Nojorid', judet: 'Bihor' },
  
  // Más localidades de Mureș
  { ciudad: 'Sâncraiu de Mureș', judet: 'Mureș' },
  { ciudad: 'Sângeorgiu de Mureș', judet: 'Mureș' },
  { ciudad: 'Corunca', judet: 'Mureș' },
  { ciudad: 'Livezeni', judet: 'Mureș' },
  
  // Localidades de Galați
  { ciudad: 'Șendreni', judet: 'Galați' },
  { ciudad: 'Vânători', judet: 'Galați' },
  { ciudad: 'Braniștea', judet: 'Galați' },
  
  // Localidades turísticas adicionales
  { ciudad: 'Băile Tușnad', judet: 'Harghita' },
  { ciudad: 'Lacu Roșu', judet: 'Harghita' },
  { ciudad: 'Praid', judet: 'Harghita' },
  { ciudad: 'Corund', judet: 'Harghita' },
  { ciudad: 'Borsec', judet: 'Harghita' },
  { ciudad: 'Izvoru Mureșului', judet: 'Harghita' },
];
