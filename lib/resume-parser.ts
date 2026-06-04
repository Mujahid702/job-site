// @ts-ignore
import mammoth from "mammoth";

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse is a CommonJS module without default ESM export.
    // Using require on the server-side ensures clean parsing under Turbopack.
    const pdf = require("pdf-parse");
    const data = await pdf(buffer);
    return data.text || "";
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF document. It might be scanned or corrupted.");
  }
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse Word document.");
  }
}
