create user tcpd@localhost;
create schema tcpd;
grant all privileges on tcpd.* to tcpd@localhost;
use tcpd;

create table users (
  id varchar(30) not null primary key,
  session varchar(10) not null,
  login varchar(30) not null,
  name varchar(30),
  email varchar(30),
  accesstoken varchar(100) not null,
  refreshtoken varchar(100) not null,
  createdAt timestamp default current_timestamp not null
);

create table point2name (
  id varchar(50) not null primary key,
  name varchar(30),
  bid varchar(30)
);

create table pointimage (
  id varchar(50) not null primary key,
  url varchar(100) not null,
  channelid varchar(30) not null
);