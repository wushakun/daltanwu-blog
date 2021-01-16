---
layout: HEVC
title: HEVC系列(一) HEVC编码结构
date: 2019-07-05 21:16:24
tags:
    - HEVC
    - 编解码基础
---

### GOP

#### 封闭式GOP
![](http://60.205.3.9/img/openGop.PNG)
#### 开放式GOP
![](http://60.205.3.9/img/closeGop.png)
### Slice划分
![](http://60.205.3.9/img/slice.png)

### VPS/SPS/PPS

#### 各层的引用关系
![](http://60.205.3.9/img/decodeStruct.png)

#### VPS
多个SPS层共享的语法元素，且不属于SPS的特定信息。如编解码档次级别（最大采样频率、最大图像尺寸、最大比特率、最大图像缓存）等，
满足某一层级的解码器应当可以解码当前及比当前更低的层级的所有码流。

#### SPS
多个PPS共享的语法元素,其主要包括图像格式信息，编码参数信息(如变换块最
大最小尺寸等)，参考图像相关信息等。

#### PPS
如果是multi-slice编码，那么多个SS共享一个PPS,其主要存储的是编码工具的可
用性标志(如环路滤波是否可以跨越slice边界等),量化相关信息(如qp等),
tile相关信息等。