---
layout: 音视频基础
title: 音视频封装格式（一）__MP4
date: 2019-07-05 21:16:24
tags:
    - 音视频基础
    - MP4
---

## 概述

* MP4的所有数据都装在box中，也就是说MP4由若干个box组成，每个box由类型和长度，可以将box理解为一个数据对象块。一个box中可以包含另一个box，这种bax也叫做container box。
* 一个MP4文件只有一个”ftyp“的box，作为MP4格式的标识并包含一些文件的信息。之后会有一个“moov”类型的box，它是一个container box，子box中包含文件的metadata信息。MP4的视频数据包含在“mdat”类型的box中，该类型的box也是一个container box，可以有多个，也可以一个也没有，媒体数据结构在metadata中描述。

### 基础概念

* track 一个视频或音频序列或者其它媒体流集合
* hint track 不包含媒体数据，而是包含了一些将其他数据track打包成流媒体的指示信息
* sample 分成两种，对于hint track来说，sample定义了一个或多个流媒体包的格式，对于track来说，video sample 即为一帧视频，或者一组连续帧视频，audio sample即为一段连续的压缩视频，它们统称为sample
* sample table 指明sample时序和物理布局的表
* chunk 一个track的几个sample组成的单元

## Box

* Box为网络字节序，即大端字节序（高位在低字节）
* 标准的box 结构
![](http://60.205.3.9/img/mp4_box.jpg)
