module.exports = (products, email) => {
  const total = products.reduce((acc, curr) => acc + curr.price, 0);
  return { products, user: { email }, total_price: total };
};
