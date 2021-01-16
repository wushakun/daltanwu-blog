---
layout: 多线程
title: 线程的同步与互斥（三）__关键段CS
date: 2019-05-07 21:16:24
tags:
    - 多线程
---

## 关键段CS

### 关键段相关函数

#### 初始化

* 原型 : void InitializeCriticalSection(LPCRITICAL_SECTIONlpCriticalSection);

* 说明：定义关键段变量后必须先初始化。

#### 销毁
* 原型：void DeleteCriticalSection(LPCRITICAL_SECTIONlpCriticalSection);

* 说明：用完之后记得销毁。

#### 进入关键区域

* 原型：void EnterCriticalSection(LPCRITICAL_SECTIONlpCriticalSection);

* 说明：系统保证各线程互斥的进入关键区域。

 

#### 离开关关键区域

* 原型：void LeaveCriticalSection(LPCRITICAL_SECTIONlpCriticalSection);

* 说明：使用完临界资源后记得离开关键区域，否则将阻塞其它线程。

### 一个例子

#### 程序源码

来自 https://blog.csdn.net/morewindows/article/details/7442639

~~~ C++
#include <stdio.h>
#include <process.h>
#include <windows.h>
long g_nNum;
unsigned int __stdcall Fun(void *pPM);
const int THREAD_NUM = 10;
//关键段变量声明
CRITICAL_SECTION  g_csThreadParameter;//
CRITICAL_SECTION  g_csThreadCode;
int main()
{
	printf("     经典线程同步 关键段\n");
	printf(" -- by MoreWindows( http://blog.csdn.net/MoreWindows ) --\n\n");
 
	//关键段初始化
	InitializeCriticalSection(&g_csThreadParameter);
	InitializeCriticalSection(&g_csThreadCode);
	
	HANDLE  handle[THREAD_NUM];	
	g_nNum = 0;	
	int i = 0;
	while (i < THREAD_NUM) 
	{
		EnterCriticalSection(&g_csThreadParameter);//进入子线程序号关键区域
		handle[i] = (HANDLE)_beginthreadex(NULL, 0, Fun, &i, 0, NULL);
		++i;
	}
	WaitForMultipleObjects(THREAD_NUM, handle, TRUE, INFINITE);
 
	DeleteCriticalSection(&g_csThreadCode);
	DeleteCriticalSection(&g_csThreadParameter);
	return 0;
}
unsigned int __stdcall Fun(void *pPM)
{
	int nThreadNum = *(int *)pPM; 
	LeaveCriticalSection(&g_csThreadParameter);//离开子线程序号关键区域
 
	Sleep(50);//some work should to do
 
	EnterCriticalSection(&g_csThreadCode);//进入各子线程互斥区域
	g_nNum++;
	Sleep(0);//some work should to do
	printf("线程编号为%d  全局资源值为%d\n", nThreadNum, g_nNum);
	LeaveCriticalSection(&g_csThreadCode);//离开各子线程互斥区域
	return 0;
}
~~~

#### 输出
![](http://60.205.3.9/img/CS_1.PNG)

#### 为什么需要g_csThreadParameter

注意，handle[i] = (HANDLE)_beginthreadex(NULL, 0, Fun, &i, 0, NULL)；这一句，传入的是i的地址，由于i在主线程一直在做++i的操作，有可能在子线程取到i的地址对应的值的时候，已经不是创建时传入的i的地址对应的值了。
这里有两个解决方案

* 给每个线程申请一块内存

~~~
		while (i < THREAD_NUM)
		{
			EnterCriticalSection(&g_csThreadParameter);//进入子线程序号关键区域
			int *pTmp = (int *)malloc(sizeof(int));
			*pTmp = i;
			handle[i] = (HANDLE)_beginthreadex(NULL, 0, Fun, pTmp, 0, NULL);
			++i;
		}
~~~

这个方法的弊端很明显，需要在主线程申请内存，然后在子线程用完后释放，容易造成内存泄漏

* 保证主线程和子线程对i的地址访问的同步

即例程中的方法，在传入i的地址前进入关键段，然后子线程取到i的地址后离开临界段，保证子线程取到i的地址对应的值的就是创建时i的地址对应的值。

但是恐怖的事情发生了。。。	

这个临界区并没有生效，从函数执行的结果上看，似乎打印的是主线程最后一次给i赋的值，看样子像主线程中的while循环已经执行完了，子线程才第一次获取到i的值打印，难道这是个假函数？

如图所示，尝试在主线程和子线程分别加断点，看函数的执行情况

![](http://60.205.3.9/img/CS_2.PNG)

按原来的设想，由于临界区的作用，主线程和子线程应该是交替访问的，可事实并非如此，在子线程还没有离开关键段时，主线程竟然连续进入了三次临界区。那么实锤了，这是个假函数。

开玩笑的。微软的API应该不会有假。那真正的原因是什么呢？

看看关键段CRITICAL_SECTION的定义，每个参数的解释我直接加在注释里

~~~
	typedef struct _RTL_CRITICAL_SECTION {
    PRTL_CRITICAL_SECTION_DEBUG DebugInfo;

    //
    //  The following three fields control entering and exiting the critical
    //  section for the resource
    //

    LONG LockCount;				//初始化为-1，n表示有n个线程在等待。
    LONG RecursionCount;		//表示该关键段的拥有线程对此资源获得关键段次数，初为0。
    HANDLE OwningThread;        //拥有该关键段的线程句柄
    HANDLE LockSemaphore;		//实际上是一个自复位事件。
    ULONG_PTR SpinCount;        //旋转锁的设置，单CPU下忽略 
} RTL_CRITICAL_SECTION, *PRTL_CRITICAL_SECTION;
~~~

从 OwningThread 这个参数看，关键段是有**线程所有权**的，即这个关键段的所有权归创建它的线程，也就是主线程。

因此可以将关键段比作旅馆的房卡，调用EnterCriticalSection()即申请房卡，得到房卡后自己当然是可以多次进出房间的，在你调用LeaveCriticalSection()交出房卡之前，别人自然是无法进入该房间。

主线程正是由于拥有“线程所有权”即房卡，所以它可以重复进入关键代码区域从而导致子线程在接收参数之前主线程就已经修改了这个参数。

所以关键段可以用于**线程间的互斥，但不可以用于同步**

但事情也不是绝对的，如果你非要同步的话，可以尝试丢掉你的“房卡”，比如这样，
~~~
	while (i < THREAD_NUM)
	{
		EnterCriticalSection(&g_csThreadParameter);//进入子线程序号关键区域
		g_csThreadParameter.OwningThread = NULL;
		handle[i] = (HANDLE)_beginthreadex(NULL, 0, Fun, &i, 0, NULL);
		++i;
	}
~~~

也是可以实现同步的

#### 旋转锁

关键段的定义中有个参数SpinCount，这是用来设置旋转锁的，

由于线程切换到等待状态的开销比较大，所以关键段中加入了旋转锁。**这样在EnterCriticalSection()时，会先用一个旋转锁不断循环，尝试一段时间才会将线程切换到等待状态**。

这就好比一个人拿到了房卡，在使用房间，你敲门发现里面有人，然后你就跑到一楼大厅去等待。

可能拿到房卡的人只要用1s的房间，你也要这样来回跑，那就非常浪费时间。

所以你可以先在门口稍微等一等，至于等多久就依赖于spincount设置的次数。

如下是旋转锁的设置方式

1. 直接在初始化关键段时设置旋转锁次数（InitializeCriticalSectionAndSpinCount）
	* 原型：BOOL InitializeCriticalSectionAndSpinCount(LPCRITICAL_SECTION lpCriticalSection,DWORD dwSpinCount);
	* 说明：旋转次数一般设置为4000。

2. 修改旋转锁次数（SetCriticalSectionSpinCount）
	* 原型：DWORD SetCriticalSectionSpinCount(LPCRITICAL_SECTION lpCriticalSection, DWORD dwSpinCount);

### 参考资料

https://blog.csdn.net/zhimeng567/article/details/78267832