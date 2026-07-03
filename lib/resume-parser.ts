// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
// @ts-ignore
import mammoth from "mammoth";

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || "";
  } catch (error: any) {
    console.error("Error parsing PDF:", error);
    throw new Error(`Failed to parse PDF document: ${error?.message || error}`);
  }
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error: any) {
    console.error("Error parsing DOCX:", error);
    throw new Error(`Failed to parse DOCX document: ${error?.message || error}`);
  }
}
