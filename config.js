module.exports = {
  port   : 9998,
  expired: 60, // 60 秒过期校验
  key    : 'uGTI6G1gSlq2ePpkRSxQFyS8tC8sh0$n', //32位
  secret : 'D%R$vYJh0LzZFK4J', //16位

  databases: [
    /*
     * 在这里写数据库配置
     * 配置好后将 id 填入 DataV 后台的“数据库”一栏中
     */
    {
      id: 'test',
      type: 'mysql', // rds, ads
      host: '127.0.0.1',
      user: 'root',
      password: 'root',
      database: 'test',
      port: 3306,
    },
  ]
}
