---
layout: TCP/IP协议
title: TCP三次握手和四次挥手的简单理解
date: 2019-04-18 21:16:24
tags:
    - TCP/IP
---

## STL六大组件
* 容器 container
* 算法 algorithm
* 迭代器 iterator
* 仿函数 function object
* 适配器 adaptor
* 空间配置器 allocator

## 容器
### 七种基本容器
* vector
* deque
* list
* set
* multiset
* map
* mutimap

### 序列式容器与关联式容器
* 序列式容器

	序列式容器Sequence containers,其中每个元素均有固定位置——取决于插入时机和地点，和元素值无关。（vector、deque、list）
* 关联式容器

	关联式容器Associative containers，元素位置取决于特定的排序准则以及元素值，和插入次序无关。（set、multiset、map、multimap）

### 向量vector
* 以常数时间访问和修改任意元素
* 插入和删除效率低，尤其是对头部插入或删除元素代价惊人的高
* 插入可能会导致迭代器失效

### 双端队列deque	
* 与vector基本相同
* 在头部与尾部插入与删除的效率高

### 表list
* 对任意元素的访问与两端的举例成正比
* 插入和删除为常数时间

### 队列quue
* 先进先出
* 插入只能在尾部进行，删除和修改只能从头部进行

### 堆栈stack
* 先进后出
* 序列中被删除，检索，修改的项只能是最近插入序列的项

### 集合set
* 由节点组成的红黑树，节点不能重复
* 具有快速查找的功能，但以牺牲插入和删除操作的效率为代价

### 多重集合mutiset
* 和集合基本相同，支持重复元素

### 映射
* 由键值对组成的集合
* 具有快速查找的能力

### 多重映射mutimap
* 和映射基本相同，一个键可以对应多个值

## 算法
### &lt;algorithm&gt;

&lt;algorithm&gt;是所有STL头文件中最大的一个，它是由一大堆模版函数组成的，可以认为每个函数在很大程度上都是独立的，其中常用到的功能范 围涉及到比较、交换、查找、遍历操作、复制、修改、移除、反转、排序、合并

### &lt;numeric&gt;
&lt;numeric&gt;体积很小，只包括几个在序列上面进行简单数学运算的模板函数，包括加法和乘法在序列上的一些操作。

### &lt;functional&gt;
&lt;functional&gt;中则定义了一些模板类，用以声明函数对象

## 迭代器
* 
