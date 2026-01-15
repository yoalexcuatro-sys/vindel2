import SwiftUI

struct ProductCardView: View {
    let product: Product
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Image Section
            ZStack(alignment: .topTrailing) {
                AsyncImage(url: URL(string: product.image)) { phase in
                    switch phase {
                    case .empty:
                        Color.gray.opacity(0.1)
                            .overlay(ProgressView())
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        Color.gray.opacity(0.2)
                            .overlay(Image(systemName: "photo").foregroundStyle(.gray))
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(height: 180)
                .clipped()
                
                if product.negotiable {
                    Text("Negociabil")
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.ultraThinMaterial)
                        .cornerRadius(4)
                        .padding(8)
                }
            }
            .background(Color.gray.opacity(0.1))
            
            // Content Section
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(product.formattedPrice)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.vindelTeal)
                    
                    Spacer()
                    
                    Button {
                        // Toggle favorite action
                    } label: {
                        Image(systemName: "heart")
                            .foregroundColor(.gray)
                    }
                }
                
                Text(product.title)
                    .font(.subheadline)
                    .lineLimit(2)
                    .foregroundColor(.primary)
                
                HStack {
                    Image(systemName: "mappin.and.ellipse")
                        .font(.caption)
                    Text(product.location)
                        .font(.caption)
                    
                    Spacer()
                    
                    Text(product.createdAt.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                }
                .foregroundColor(.secondary)
            }
            .padding(12)
        }
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 4)
    }
}

#Preview {
    ZStack {
        Color.gray.opacity(0.1)
        ProductCardView(product: Product.mock)
            .frame(width: 200)
            .padding()
    }
}
