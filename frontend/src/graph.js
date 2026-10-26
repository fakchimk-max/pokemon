const pageGraph = {
  home: ['pokedex', 'moves', 'item'],
  pokedex: ['home'],
  moves: ['home', 'moves/attacks', 'moves/abilities'],
  'moves/attacks': ['moves'],
  'moves/abilities': ['moves'],
  item: ['home']
};

export const pageLabels = {
  home: 'จัดทีม',
  pokedex: 'ข้อมูลโปเกมอน',
  moves: 'ท่าโจมตี & ความสามารถพิเศษ',
  'moves/attacks': 'ท่าโจมตี',
  'moves/abilities': 'ความสามารถพิเศษ',
  item: 'ไอเทม'
};

export default pageGraph;