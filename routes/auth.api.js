const express = require("express");
const router = express.Router();
const passport = require("passport");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
    session: false,
  }),
  async (req, res) => {
    const token = await req.user.generateToken();

    res.redirect(`http://localhost:5173/login?token=${token}`);
  },
);

module.exports = router;
