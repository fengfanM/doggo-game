const config = {
  pages: [
    'pages/game/index',
    'pages/level/index',
    'pages/mine/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF9A3C',
    navigationBarTitleText: '狗了个狗',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#6B5B4F',
    selectedColor: '#FF9A3C',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/game/index',
        text: '游戏'
      },
      {
        pagePath: 'pages/level/index',
        text: '关卡'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
}

export default config
