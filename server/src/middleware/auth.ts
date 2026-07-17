import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

interface DecodedToken {
  id: string;
}

export const authGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET ?? "supersecretkey_bloodlink_12345";
    const decoded = jwt.verify(token, secret) as DecodedToken;

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Not authorized, invalid token" });
  }
};
