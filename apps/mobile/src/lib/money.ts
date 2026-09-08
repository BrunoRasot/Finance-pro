export function amount(value: string, currency: string) {
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) throw new Error('Importe inválido');
  const negative = value.startsWith('-');
  const [whole, fraction = '00'] = value.replace(/^-/, '').split('.');
  const symbol =
    currency === 'PEN' ? 'S/' : currency === 'USD' ? 'US$' : currency;
  return `${symbol} ${negative ? '-' : ''}${new Intl.NumberFormat('en-US').format(BigInt(whole))}.${fraction.padEnd(2, '0')}`;
}
