const StatsSection = () => {
  const stats = [
    { value: "10K+", label: "Active Sellers" },
    { value: "100K+", label: "Monthly Sales" },
    { value: "50K+", label: "Happy Customers" },
    { value: "99%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-blue mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsSection; 