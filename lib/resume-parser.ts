import { PDFParse } from "pdf-parse";
import { pathToFileURL } from "url";
import path from "path";
// @ts-ignore
import mammoth from "mammoth";


export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || "";
  } catch (error: any) {
    console.error("Error parsing PDF:", error);
    throw new Error(`Failed to parse PDF document: ${error?.message || error}`);
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
