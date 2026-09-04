// Phone numbers are considered valid once they carry exactly 10 digits,
// regardless of the punctuation/formatting the user typed them with.
export function isValidPhone(str) {
  return (str || '').replace(/\D/g, '').length === 10;
}
