import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
};

const deviationSlice = createSlice({
  name: "deviation",
  initialState,
  reducers: {
    setDeviation: (state, action) => {
      state.data = action.payload;
    },

    updateDeviationField: (
      state,
      action
    ) => {
      if (!state.data) {
        state.data = {};
      }

      const { field, value } = action.payload;

      state.data[field] = value;
    },

    clearDeviation: (state) => {
      state.data = null;
    },
  },
});

export const {
  setDeviation,
  updateDeviationField,
  clearDeviation,
} = deviationSlice.actions;

export default deviationSlice.reducer;