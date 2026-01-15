import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = ProductListViewModel()
    
    var body: some View {
        TabView {
            // Home Tab
            NavigationView {
                ScrollView {
                    if viewModel.isLoading {
                        ProgressView()
                            .padding(.top, 50)
                    } else {
                        LazyVGrid(columns: [
                            GridItem(.flexible(), spacing: 16),
                            GridItem(.flexible(), spacing: 16)
                        ], spacing: 16) {
                            ForEach(viewModel.products) { product in
                                NavigationLink(destination: ProductDetailView(product: product)) {
                                    ProductCardView(product: product)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .padding()
                    }
                }
                .navigationTitle("Vindel")
                .background(Color(.systemGroupedBackground))
                .refreshable {
                    await viewModel.fetchProducts()
                }
            }
            .tabItem {
                Label("Acasă", systemImage: "house")
            }
            .task {
                await viewModel.fetchProducts()
            }
            
            // Search Tab (Placeholder)
            Text("Căutare")
                .tabItem {
                    Label("Căutare", systemImage: "magnifyingglass")
                }
            
            // Publish Tab (Placeholder)
            Text("Publică")
                .tabItem {
                    Label("Vinde", systemImage: "plus.circle.fill")
                }
            
            // Messages Tab (Placeholder)
            Text("Mesaje")
                .tabItem {
                    Label("Mesaje", systemImage: "message")
                }
            
            // Profile Tab (Placeholder)
            Text("Profil")
                .tabItem {
                    Label("Cont", systemImage: "person")
                }
        }
        .accentColor(.vindelTeal)
    }
}

#Preview {
    ContentView()
}
