import bcrypt from "bcryptjs";

const pin = process.argv[2];

if (!pin) {
  console.error("Usage: npm run hash-pin -- <pin>");
  process.exit(1);
}

const hash = await bcrypt.hash(pin, 10);
console.log(hash);
