<script>
export default {
  name: "PredictionItem",
  props: {
    label: {
      type: String,
      required: true,
    },
    initialConfidence: {
      type: Number,
      default: 50, // default likelihood to 50%
    },
  },
  data() {
    return {
      confidence: this.initialConfidence,
    };
  },
  computed: {
    sliderStyle() {
      const value = this.confidence;
      return {
        background: `linear-gradient(
          to right,
          rgb(231, 76, 60) 0%,
          rgb(55, 90, 127) 50%,
          rgb(0, 188, 140) 100%
        ) no-repeat`,
        backgroundSize: `100% 100%`
      };
    }
  }
};
</script>

<template>
  <div class="border rounded px-1 mb-1 bg-dark">
    <div class="position-relative">
      <button class="btn btn-sm btn-danger position-absolute top-0 end-0 mt-1 p-0" @click="$emit('remove')">Remove</button>
    </div>
    <div class="d-flex justify-content-between align-items-center">
      <div class="py-0 px-1 my-0 flex-fill w-100 align-items-center lh-sm" v-html="label">
      </div>
      <!-- Likelihood Slider -->
      <div class="d-inline justify-content-end align-items-end mt-4 pt-0 px-1 slider-container">
        <label class="form-label mb-0 py-0 small">
          <small>Likelihood: {{ confidence }}%</small>
        </label>
        <input class="form-range rounded" type="range" step="10" min="0" max="100" v-model.number="confidence" @input="$emit('update-confidence', confidence)" :style="sliderStyle" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-close {
  background: none;
  border: none;
}

.slider-container label {
  width: 16ch;
  text-align: left;
  margin-right: 0.5rem
}
</style>

<style>
/* slider thumb styling */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
}
</style>