const bcrypt = require("bcrypt");

try {
  const salt = await bcrypt.genSalt();
  const hashedOTP = await bcrypt.hash(otp, salt);
  console.log(salt);
  console.log(hashedOTP);
} catch (error) {
  console.log(error);
}
