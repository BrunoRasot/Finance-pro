export function validNewPassword(value: string) {
  return value.length >= 12 && value.length <= 128;
}
