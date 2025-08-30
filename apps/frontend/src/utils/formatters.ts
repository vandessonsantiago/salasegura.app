// Utils para formatação de dados
export const formatCPF = (value: string): string => {
  // Remove tudo que não é dígito
  const cpf = value.replace(/\D/g, '');

  // Aplica a máscara
  if (cpf.length <= 3) {
    return cpf;
  } else if (cpf.length <= 6) {
    return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  } else if (cpf.length <= 9) {
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  } else {
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
  }
};

export const formatPhone = (value: string): string => {
  // Remove tudo que não é dígito
  const phone = value.replace(/\D/g, '');

  // Aplica a máscara
  if (phone.length <= 2) {
    return `(${phone}`;
  } else if (phone.length <= 6) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
  } else if (phone.length <= 10) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
  } else {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
  }
};
