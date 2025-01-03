export type ControlAction  = {
  action: (value: number) => void;
  title: string;
  value: number;
} & ({
  values: number[];
  max?: never;
  min?: never;
} | {
  max: number;
  min: number;
  values?: never;
})
