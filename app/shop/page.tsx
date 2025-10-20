export default function Shop() {
  const products = [
    {
      id: 1,
      name: "Basic Plan",
      price: "$9.99",
      description: "Perfect for individuals and small projects",
      features: ["Up to 5 projects", "Basic analytics", "Email support"],
    },
    {
      id: 2,
      name: "Pro Plan",
      price: "$29.99",
      description: "Ideal for growing businesses",
      features: [
        "Unlimited projects",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
      ],
    },
    {
      id: 3,
      name: "Enterprise Plan",
      price: "$99.99",
      description: "For large organizations with specific needs",
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "Custom solutions",
        "SLA guarantee",
      ],
    },
  ];

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Shop</h1>
        <p className="text-lg mb-12 text-gray-600 dark:text-gray-400">
          Choose the perfect plan for your needs
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-2xl font-semibold mb-2">{product.name}</h2>
              <p className="text-3xl font-bold mb-4">{product.price}</p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {product.description}
              </p>

              <ul className="space-y-2 mb-6">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm h-10 px-4">
                Get Started
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
