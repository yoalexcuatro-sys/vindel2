import SwiftUI

struct ProductDetailView: View {
    let product: Product
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Main Image
                AsyncImage(url: URL(string: product.image)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.1))
                        .frame(height: 300)
                }
                .frame(maxWidth: .infinity)
                .background(Color.black)
                
                VStack(alignment: .leading, spacing: 16) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text(product.title)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text(product.formattedPrice)
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.vindelTeal)
                    }
                    
                    Divider()
                    
                    // Details
                    VStack(alignment: .leading, spacing: 12) {
                        DetailRow(icon: "tag", title: "Categorie", value: product.category)
                        DetailRow(icon: "mappin.and.ellipse", title: "Locație", value: product.location)
                        DetailRow(icon: "sparkles", title: "Stare", value: product.condition)
                    }
                    
                    Divider()
                    
                    // Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Descriere")
                            .font(.headline)
                        
                        Text(product.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    
                    Divider()
                    
                    // Seller Info
                    HStack {
                        Circle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(width: 50, height: 50)
                            .overlay(Text(product.seller.name.prefix(1)).fontWeight(.bold))
                        
                        VStack(alignment: .leading) {
                            Text(product.seller.name)
                                .font(.headline)
                            HStack {
                                Image(systemName: "star.fill")
                                    .foregroundColor(.yellow)
                                    .font(.caption)
                                Text("\(String(format: "%.1f", product.seller.rating))")
                                    .font(.caption)
                                    .fontWeight(.bold)
                            }
                        }
                        
                        Spacer()
                        
                        Button {
                            // Call Action
                        } label: {
                            Image(systemName: "phone.circle.fill")
                                .resizable()
                                .frame(width: 40, height: 40)
                                .foregroundColor(.green)
                        }
                        
                        Button {
                            // Message Action
                        } label: {
                            Image(systemName: "message.circle.fill")
                                .resizable()
                                .frame(width: 40, height: 40)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(12)
                }
                .padding()
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .frame(width: 24)
                .foregroundColor(.secondary)
            Text(title)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

#Preview {
    NavigationView {
        ProductDetailView(product: Product.mock)
    }
}
