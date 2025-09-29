const Stats = () => {
  const stats = [
    {
      number: "1000+",
      label: "منشأة تجارية",
      description: "تستخدم النظام بثقة"
    },
    {
      number: "50M+",
      label: "ريال سعودي",
      description: "قيمة المعاملات الشهرية"
    },
    {
      number: "99.9%",
      label: "وقت التشغيل",
      description: "موثوقية عالية"
    },
    {
      number: "24/7",
      label: "دعم فني",
      description: "خدمة مستمرة"
    }
  ];

  return (
    <section className="py-16 bg-gradient-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center text-white">
              <div className="text-4xl lg:text-5xl font-bold mb-2">{stat.number}</div>
              <div className="text-lg font-semibold mb-1">{stat.label}</div>
              <div className="text-sm opacity-90">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;