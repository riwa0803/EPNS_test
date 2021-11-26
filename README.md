Command log
#node
https://docs.aws.amazon.com/ja_jp/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
close and reopen
. ~/.nvm/nvm.sh
nvm install node
nvm --version



#docker
https://kacfg.com/aws-ec2-docker/
sudo yum update -y
sudo amazon-linux-extras install -y docker
amazon-linux-extras | grep docker
sudo systemctl start docker
systemctl status docker
sudo systemctl enable docker
systemctl is-enabled docker
grep docker /etc/group
sudo usermod -a -G docker ec2-user
reflesh
docker info

#docker-compose
VER=1.29.2
sudo curl -L https://github.com/docker/compose/releases/download/${VER}/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
docker-compose --version

#EPNS
sudo yum install git
y
git clone https://github.com/riwa0803/EPNS_test.git
cd EPNS_test
sudo docker-compose up -d

この段階でnpm installしてみている

mv .env.new .env

ここでNPM install?
別タブを開く？

npm start
sh: nodemon: command not found
npm install -g nodemon
sh: ts-node: command not found
npm install -g ts-node
Error: Cannot find module 'reflect-metadata'
npm install -g reflect-metadata
crash
npm install
rm -rf node_modules/

#初回
npm start がエラー
NOENT: no such file or directory, open '/home/ec2-user/package.json'
mv package.json /home/ec2-user/package.json
npm start がエラー
sh: nodemon: command not found
npm uninstall nodemon
sudo npm install -g --force nodemon

#2回め
npm install ts-node
npm start→コマンドなしエラー、run使えと言われる
npm run

#3回め
npm install reflect-metadata


# EPNS Showrunners (Server)

The EPNS Showrunners handles the channels created and maintaned by us. It also shows how easy it is to interact with the protocol to build highly customized notifications for your dApp, smart contracts or even centralized services.

## Installation and Set Up Guide

- Install docker 
- Clone the repo
``` git clone https://github.com/ethereum-push-notification-service/epns-showrunners.git```
- Open the root folder in a terminal and enter 
```docker-compose up```. This initalises mongodb, redis and ipfs local instances
- Open the root folder in another terminal and enter
```npm install```
```npm start```

### To exit 
- To stop running the showrunners server, press ```Ctrl + C```
- To stop running the docker, press ```Ctrl + C``` and enter
```docker-compose down```

## Showrunner Channels

- To subscribe to channels, please visit our [Alpha dApp](https://app.epns.io)
- Currently notifications can be recieved through our [Google Play Alpha App](https://play.google.com/store/apps/details?id=io.epns.epns)
- The alpha protocol and product are working and are in ropsten network
- **Have an idea for protocol or product?** Awesome! get in touch by joining our [Telegram Group](https://t.me/epnsproject) or following us on [Twitter](https://twitter.com/epnsproject)

## Technical Details

Following definitions are used in the rest of the spec to refer to a particular category or service.
| Term | Description
| ------------- | ------------- |
| Showrunners | Showrunners are Channels on EPNS notification protocol that are created and maintained by us |

### Tech Specs

The Showrunners run on node.js server and are modularized on the ideas and architecture of [Bulletproof NodeJS](https://github.com/santiq/bulletproof-nodejs), the essential features in the architeture are as follows:

- **config** defines all the necessary configuration
- **Jobs** is used to handle waking up different channels for various purpose. Very useful in sending notifications from channel at a specific interval
- **dbListener** can be used to listen to and trigger functions on DB changes, we have left the interpretation and an example over there for whoever wants to use them
- **showrunners** are the actual channels and contain logic which is required for them to construct notification according to their use cases
- **middlewares and routes** will probably not be active on your production server but are given to test the channel in development mode. for example: triggering functions using postman or similar service and seeing the response
- **database** the architecture has been changed from MongoDB to mysql to show how easy it is to have either of the database if required

### Credits

- [Bulletproof NodeJS](https://github.com/santiq/bulletproof-nodejs)

### External Services

We would need external services of:

- [Mongodb](https://www.mongodb.com/) - Primary Database : [Installation](https://docs.mongodb.com/manual/installation/) We would be using Mongodb Atlas
- [Redis](https://www.mongodb.com/) - Internal Cache : [Installation](https://redis.io/topics/quickstart)
- [Mongodb Atlas](https://www.mongodb.com/cloud/atlas)

For local ease of development, we make use of [Docker](https://docs.docker.com/get-docker/).

To start these services,

- Install Docker
- cd into this project on a terminal
- Run `docker-compose up`
