import * as FormData from "form-data";


export default function toFormData(obj: Record<string, any>): FormData {
  const form = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, value);
    }
  });
  return form;
}