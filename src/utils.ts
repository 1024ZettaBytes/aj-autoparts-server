export const InternalError = (msg: string): any => {
  let err = new Error(msg);
  err.name = "INTERNAL";
  return err;
};
export const setDateToStartOfDay = (date: Date) => {
  let newDate = new Date(date);
  newDate.setHours(0);
  newDate.setMinutes(0);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
};