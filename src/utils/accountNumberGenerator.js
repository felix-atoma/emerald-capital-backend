export const generateAccountNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EC${timestamp.slice(-6)}${random}`;
};

export const validateAccountNumber = (accountNumber) => {
  const regex = /^EC\d{10}$/;
  return regex.test(accountNumber);
};