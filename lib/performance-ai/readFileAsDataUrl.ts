export default function readFileAsDataUrl(
  file: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(
          new Error(
            "Não foi possível ler o arquivo selecionado."
          )
        );
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(
        new Error(
          "Não foi possível ler o arquivo selecionado."
        )
      );
    };

    reader.readAsDataURL(file);
  });
}
