export const InternalError = (msg: string): any => {
  let err = new Error(msg);
  err.name = "INTERNAL";
  return err;
};
