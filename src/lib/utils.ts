export const getFileExtension = (fileName: string): string => {
  const splited = fileName.split(".");
  return splited[splited.length - 1];
};
