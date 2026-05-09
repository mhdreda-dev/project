function App(){
  return (
    <div className="relative">
      <Navbar />
      <Hero />
      <FeaturedGrid />
      <CampaignSection />
      <CategoryStrip />
      <TrustSection />
      <PremiumFooterCTA />
      <Footer />
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
