import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TaskMeta {
  id: string;
  task: string;
  units: string[]; // Array of units
  default_target: Record<string, any>; // JSONB structure for flexible targets
  type: string;
  color: string;
  icon: string;
  measurable: boolean;
}

type TasksState = {
  taskmeta: TaskMeta[];
  canShowSideBar: boolean;
  taskTrackingId: string;
  selectedDate: string; // Store date as a string in YYYY-MM-DD format
  taskTrackingDetails: TaskMeta; // Details of the currently tracked task
};

const initialState: TasksState = {
  canShowSideBar: false,
  taskmeta: [],
  taskTrackingId: '',
  selectedDate: new Date().toISOString().split('T')[0], // Default to today's date in YYYY-MM-DD format
  taskTrackingDetails: {
    id: '',
    task: '',
    units: [],
    default_target: {},
    type: '',
    color: '',
    icon: '',
    measurable: false,
  },
};

interface sideBarProps {
  canShowSideBar: boolean;
  setCanShowSideBar: (value: boolean) => void;
  taskTrackingId: string;
  setTaskTrackingId: (value: string) => void;
  selectedDate: Date;
  setSelectedDate: (value: string) => void;
  taskTrackingDetails: TaskMeta;
}
const taskMetaSlice = createSlice({
  name: 'taskmeta',
  initialState,
  reducers: {
    setTaskMeta: (state, action: PayloadAction<TaskMeta[]>) => {
      state.taskmeta = action.payload;
    },
    clearTaskMeta: (state, action: PayloadAction<TaskMeta[]>) => {
      state.taskmeta = action.payload;
    },
    setCanShowSideBar: (state, action: PayloadAction<boolean>) => {
      state.canShowSideBar = action.payload;
    },
    setTaskTrackingId: (state, action: PayloadAction<string>) => {
      state.taskTrackingId = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setTaskTrackingDetails: (state, action: PayloadAction<TaskMeta>) => {
      state.taskTrackingDetails = action.payload;
    },
    clearTaskTrackingDetails: (state) => {
      state.taskTrackingDetails = {
        id: '',
        task: '',
        units: [],
        default_target: {},
        type: '',
        color: '',
        icon: '',
        measurable: false,
      };
    }
  },
});

export const { 
  setTaskMeta,
  clearTaskMeta,
  setCanShowSideBar,
  setTaskTrackingId,
  setSelectedDate,
  setTaskTrackingDetails,
  clearTaskTrackingDetails
} = taskMetaSlice.actions;
export default taskMetaSlice.reducer;
