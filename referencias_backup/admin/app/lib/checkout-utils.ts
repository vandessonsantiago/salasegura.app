// Utilitários para o sistema de checkout

// Função para aplicar máscara em campos
export function applyMask(value: string, mask: string): string {
  let result = '';
  let valueIndex = 0;
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    if (mask[i] === '0') {
      if (/\d/.test(value[valueIndex] || '')) {
        result += value[valueIndex];
        valueIndex++;
      }
    } else {
      result += mask[i];
    }
  }
  
  return result;
}

// Função para remover máscara (apenas números)
export function removeMask(value: string): string {
  return value.replace(/\D/g, '');
}

// Máscaras específicas
export function maskCPFCNPJ(value: string): string {
  const numbers = removeMask(value);
  
  if (numbers.length <= 11) {
    return applyMask(numbers, '000.000.000-00');
  } else {
    return applyMask(numbers, '00.000.000/0000-00');
  }
}

export function maskPhone(value: string): string {
  const numbers = removeMask(value);
  
  if (numbers.length <= 10) {
    return applyMask(numbers, '(00) 0000-0000');
  } else {
    return applyMask(numbers, '(00) 00000-0000');
  }
}

export function maskCEP(value: string): string {
  const numbers = removeMask(value);
  return applyMask(numbers, '00000-000');
}

export function maskCardNumber(value: string): string {
  const numbers = removeMask(value);
  const groups = [];
  
  for (let i = 0; i < numbers.length && i < 16; i += 4) {
    groups.push(numbers.slice(i, i + 4));
  }
  
  return groups.join(' ');
}

export function maskCardExpiry(value: string): string {
  const numbers = removeMask(value);
  return applyMask(numbers, '00/00');
}

export function maskCVV(value: string): string {
  const numbers = removeMask(value);
  return numbers.slice(0, 4);
}

// Função para validar CPF
export function validateCPF(cpf: string): boolean {
  const numbers = removeMask(cpf);
  
  if (numbers.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i] || '0') * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9] || '0')) return false;
  
  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i] || '0') * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10] || '0')) return false;
  
  return true;
}

// Função para validar CNPJ
export function validateCNPJ(cnpj: string): boolean {
  const numbers = removeMask(cnpj);
  
  if (numbers.length !== 14) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Calcular primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i] || '0') * (weights1[i] || 0);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(numbers[12] || '0')) return false;
  
  // Calcular segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i] || '0') * (weights2[i] || 0);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(numbers[13] || '0')) return false;
  
  return true;
}

// Função para validar CPF/CNPJ
export function validateCPFCNPJ(value: string): boolean {
  const numbers = removeMask(value);
  
  if (numbers.length === 11) {
    return validateCPF(value);
  } else if (numbers.length === 14) {
    return validateCNPJ(value);
  }
  
  return false;
}

// Função para validar cartão de crédito (algoritmo de Luhn)
export function validateCardNumber(cardNumber: string): boolean {
  const numbers = removeMask(cardNumber);
  
  if (numbers.length < 13 || numbers.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  // Percorrer do último dígito para o primeiro
  for (let i = numbers.length - 1; i >= 0; i--) {
    let digit = parseInt(numbers[i] || '0');
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Função para detectar bandeira do cartão
export function detectCardBrand(cardNumber: string): string {
  const numbers = removeMask(cardNumber);
  
  // Visa
  if (/^4/.test(numbers)) return 'visa';
  
  // Mastercard
  if (/^5[1-5]/.test(numbers) || /^2[2-7]/.test(numbers)) return 'mastercard';
  
  // American Express
  if (/^3[47]/.test(numbers)) return 'amex';
  
  // Elo
  if (/^(636368|438935|504175|451416|636297)/.test(numbers)) return 'elo';
  
  // Hipercard
  if (/^(606282|3841)/.test(numbers)) return 'hipercard';
  
  // Discover
  if (/^6(?:011|5)/.test(numbers)) return 'discover';
  
  // JCB
  if (/^(?:2131|1800|35)/.test(numbers)) return 'jcb';
  
  return 'unknown';
}

// Função para validar data de validade do cartão
export function validateCardExpiry(expiry: string): boolean {
  const [month, year] = expiry.split('/');
  
  if (!month || !year) return false;
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  const expMonth = parseInt(month);
  const expYear = parseInt(year);
  
  if (expMonth < 1 || expMonth > 12) return false;
  
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  
  return true;
}

// Função para formatar valor monetário
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Função para formatar data
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

// Função para formatar data e hora
export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR');
}

// Função para gerar ID único
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Função para debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Função para throttle
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
