import jwt from "jsonwebtoken";

export const signAccessToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, {
        expiresIn: "15m",
    });
};
