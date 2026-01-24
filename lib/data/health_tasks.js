const taskData = [
  {
    "id": "0001",
    "index": 1,
    "task": "Water",
    "units": [
      "ml",
      "l"
    ],
    "default_target": {
      "ml": 3000,
      "l": 3
    },
    "type": "diet",
    "color": "#E91E63",
    "icon": "activity"
  },
  {
    "id": "0002",
    "index": 2,
    "task": "Gym",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 60
    },
    "type": "fitness",
    "color": "#4CAF50",
    "icon": "dumbbell"
  },
  {
    "id": "0003",
    "index": 3,
    "task": "Walk",
    "units": [
      "steps",
      "minutes",
      "km"
    ],
    "default_target": {
      "steps": 8000,
      "minutes": 60,
      "km": 5
    },
    "type": "fitness",
    "color": "#FF5722",
    "icon": "dumbbell"
  },
  {
    "id": "0004",
    "index": 4,
    "task": "Cardio",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 30
    },
    "type": "fitness",
    "color": "#607D8B",
    "icon": "dumbbell"
  },
  {
    "id": "0005",
    "index": 5,
    "task": "Run",
    "units": [
      "km",
      "minutes"
    ],
    "default_target": {
      "km": 5,
      "minutes": 30
    },
    "type": "fitness",
    "color": "#2196F3",
    "icon": "dumbbell"
  },
  {
    "id": "0006",
    "index": 6,
    "task": "Yoga",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 30
    },
    "type": "fitness",
    "color": "#2196F3",
    "icon": "dumbbell"
  },
  {
    "id": "0007",
    "index": 7,
    "task": "Cycling",
    "units": [
      "km",
      "minutes"
    ],
    "default_target": {
      "km": 10,
      "minutes": 45
    },
    "type": "fitness",
    "color": "#FF5722",
    "icon": "dumbbell"
  },
  {
    "id": "0008",
    "index": 8,
    "task": "Meditation",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 15
    },
    "type": "mind",
    "color": "#FFC107",
    "icon": "activity"
  },
  {
    "id": "0009",
    "index": 9,
    "task": "Stretching",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 10
    },
    "type": "fitness",
    "color": "#2196F3",
    "icon": "dumbbell"
  },
  {
    "id": "0010",
    "index": 10,
    "task": "Sleep",
    "units": [
      "hours"
    ],
    "default_target": {
      "hours": 8
    },
    "type": "lifestyle",
    "color": "#FFC107",
    "icon": "sun"
  },
  {
    "id": "0011",
    "index": 11,
    "task": "Reading",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 30
    },
    "type": "mind",
    "color": "#FF9800",
    "icon": "activity"
  },
  {
    "id": "0012",
    "index": 12,
    "task": "Learning",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 45
    },
    "type": "mind",
    "color": "#9C27B0",
    "icon": "activity"
  },
  {
    "id": "0013",
    "index": 13,
    "task": "Screen time",
    "units": [
      "hours",
      "minutes"
    ],
    "default_target": {
      "hours": 2,
      "minutes": 120
    },
    "type": "lifestyle",
    "color": "#E91E63",
    "icon": "sun"
  },
  {
    "id": "0014",
    "index": 14,
    "task": "Water fast",
    "units": [
      "hours"
    ],
    "default_target": {
      "hours": 16
    },
    "type": "diet",
    "color": "#8BC34A",
    "icon": "activity"
  },
  {
    "id": "0015",
    "index": 15,
    "task": "Intermittent fasting",
    "units": [
      "hours"
    ],
    "default_target": {
      "hours": 16
    },
    "type": "diet",
    "color": "#E91E63",
    "icon": "activity"
  },
  {
    "id": "0016",
    "index": 16,
    "task": "Swimming",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 30
    },
    "type": "fitness",
    "color": "#2196F3",
    "icon": "dumbbell"
  },
  {
    "id": "0017",
    "index": 17,
    "task": "Sugar",
    "units": [
      "grams"
    ],
    "default_target": {
      "grams": 30
    },
    "type": "diet",
    "color": "#9C27B0",
    "icon": "activity"
  },
  {
    "id": "0018",
    "index": 18,
    "task": "Fruits",
    "units": [
      "pieces",
      "servings"
    ],
    "default_target": {
      "pieces": 3,
      "servings": 2
    },
    "type": "diet",
    "color": "#FFC107",
    "icon": "activity"
  },
  {
    "id": "0019",
    "index": 19,
    "task": "Vegetables",
    "units": [
      "cups",
      "servings"
    ],
    "default_target": {
      "cups": 3,
      "servings": 2
    },
    "type": "diet",
    "color": "#2196F3",
    "icon": "activity"
  },
  {
    "id": "0020",
    "index": 20,
    "task": "Meal prep",
    "units": [
      "meals",
      "minutes"
    ],
    "default_target": {
      "meals": 3,
      "minutes": 60
    },
    "type": "diet",
    "color": "#FFC107",
    "icon": "activity"
  },
  {
    "id": "0021",
    "index": 21,
    "task": "Vitamins",
    "units": [
      "pills"
    ],
    "default_target": {
      "pills": 1
    },
    "type": "diet",
    "color": "#9C27B0",
    "icon": "activity"
  },
  {
    "id": "0022",
    "index": 22,
    "task": "Supplements",
    "units": [
      "pills",
      "grams"
    ],
    "default_target": {
      "pills": 1,
      "grams": 10
    },
    "type": "diet",
    "color": "#9C27B0",
    "icon": "activity"
  },
  {
    "id": "0023",
    "index": 23,
    "task": "Breathing exercises",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 10
    },
    "type": "mind",
    "color": "#2196F3",
    "icon": "activity"
  },
  {
    "id": "0024",
    "index": 24,
    "task": "Cold shower",
    "units": [
      "minutes"
    ],
    "default_target": {
      "minutes": 5
    },
    "type": "lifestyle",
    "color": "#E91E63",
    "icon": "sun"
  },
  {
    "id": "0025",
    "index": 25,
    "task": "Reduce screen time",
    "units": [
      "minutes",
      "hours"
    ],
    "default_target": {
      "minutes": 120,
      "hours": 2
    },
    "type": "lifestyle",
    "color": "#FF9800",
    "icon": "sun"
  },
  {
    "id": "0026",
    "index": 26,
    "task": "Skincare",
    "units": [],
    "default_target": {},
    "type": "lifestyle",
    "color": "#8BC34A",
    "icon": "sun"
  }
]

export default taskData
