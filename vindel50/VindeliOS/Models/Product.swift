import Foundation

enum Currency: String, Codable {
    case euro = "EUR"
    case lei = "LEI"
}

enum ProductStatus: String, Codable {
    case pending
    case approved
    case rejected
}

struct Seller: Identifiable, Codable {
    let id: String
    let name: String
    let rating: Double
    let reviews: Int
    let avatar: String
    let joined: String
}

struct Product: Identifiable, Codable {
    let id: String
    let title: String
    let price: Double
    let currency: Currency
    let negotiable: Bool
    let image: String
    let images: [String]
    let location: String
    let description: String
    let condition: String
    let category: String
    let subcategory: String?
    let views: Int
    let reserved: Bool
    let sold: Bool
    let status: ProductStatus
    let sellerId: String
    let seller: Seller
    let createdAt: Date
    
    // Helper for formatting price
    var formattedPrice: String {
        return "\(price) \(currency.rawValue)"
    }
}

// Mock Data for Preview
extension Product {
    static let mock = Product(
        id: "1",
        title: "iPhone 15 Pro Max - 256GB",
        price: 5400,
        currency: .lei,
        negotiable: true,
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569",
        images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569"],
        location: "București",
        description: "Vând iPhone 15 Pro Max în stare perfectă. Bateria 100%.",
        condition: "Utilizat - Ca nou",
        category: "Electronice",
        subcategory: "Telefoane",
        views: 120,
        reserved: false,
        sold: false,
        status: .approved,
        sellerId: "user1",
        seller: Seller(id: "user1", name: "Alex Popescu", rating: 4.8, reviews: 15, avatar: "", joined: "2024-01-01"),
        createdAt: Date()
    )
}
