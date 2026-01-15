import Foundation
import Combine

@MainActor
class ProductListViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil
    
    // In a real app, this would use the FirebaseService
    func fetchProducts() async {
        self.isLoading = true
        self.errorMessage = nil
        
        // Simulating network delay
        try? await Task.sleep(nanoseconds: 1 * 1_000_000_000)
        
        // Mock data population
        self.products = [
            Product.mock,
            Product(
                id: "2",
                title: "MacBook Pro M3",
                price: 1800,
                currency: .euro,
                negotiable: false,
                image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4",
                images: [],
                location: "Cluj-Napoca",
                description: "Laptop puternic pentru developeri.",
                condition: "Nou",
                category: "Electronice",
                subcategory: "Laptopuri",
                views: 45,
                reserved: false,
                sold: false,
                status: .approved,
                sellerId: "user2",
                seller: Seller(id: "user2", name: "Maria Ionescu", rating: 5.0, reviews: 3, avatar: "", joined: "2024-02-15"),
                createdAt: Date()
            ),
             Product(
                id: "3",
                title: "BMW Seria 3 2020",
                price: 24500,
                currency: .euro,
                negotiable: true,
                image: "https://images.unsplash.com/photo-1555215695-3004980adade",
                images: [],
                location: "Timișoara",
                description: "Mașină întreținută, service la zi.",
                condition: "Utilizat",
                category: "Auto",
                subcategory: "Autoturisme",
                views: 200,
                reserved: false,
                sold: false,
                status: .approved,
                sellerId: "user3",
                seller: Seller(id: "user3", name: "Ion Vasile", rating: 4.5, reviews: 12, avatar: "", joined: "2023-11-20"),
                createdAt: Date()
            )
        ]
        
        self.isLoading = false
    }
}
