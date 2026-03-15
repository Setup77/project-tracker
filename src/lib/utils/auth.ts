import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "ta_cle_secrete_par_defaut"

export function generateToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  }
)
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    // Renvoie null si le token est expiré ou invalide
    return null
  }
}
