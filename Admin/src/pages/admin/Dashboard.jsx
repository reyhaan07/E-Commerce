export default function Dashboard() {

  const stats = [
    { title: "Users", value: "12,450" },
    { title: "Sellers", value: "1,254" },
    { title: "Products", value: "25,400" },
    { title: "Orders", value: "8,245" },
    { title: "Revenue", value: "₹12.5L" },
    { title: "Refunds", value: "124" }
  ];

  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-5">

        {stats.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-xl shadow p-5"
          >
            <h3 className="text-gray-500">
              {item.title}
            </h3>

            <p className="text-3xl font-bold mt-2">
              {item.value}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}