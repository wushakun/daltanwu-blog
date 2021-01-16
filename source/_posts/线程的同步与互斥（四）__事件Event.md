---
layout: 多线程
title: 线程的同步与互斥（四）__事件Event
date: 2019-05-08 21:16:24
tags:
    - 多线程
---

## 事件Event

### 事件Event相关函数

#### 创建事件

* 原型：HANDLE CreateEvent(LPSECURITY_ATTRIBUTES lpEventAttributes, BOOL bManualReset, BOOL bInitialState, LPCTSTR lpName);
* 说明：
	* lpEventAttributes : 安全控制，一般传入NULL
	* bManualReset : 确定事件是手动置位还是自动置位，传入TRUE表示手动重置，传入FALSE表示自动重置。
	
	如自动重置，SetEvent之后, 事件自动重置为未触发状态
	若手动重置: SetEvent之后, 需要调用ResetEvent事件才置为未触发状态

	区别：手动置位就像一个宿舍里有人开了闹铃闹铃，一旦触发之后，所有人都会被吵醒，除非你去关闭它，否则它就会一直响，即 当一个手动重置事件被触发的时候, 正在等待该事件的所有线程都变为可调度状态; 自动置为就像医院里拍X光的房间门，门打开后只能进入一个人，这个人进去后会将门关上，其它人不能进入除非门重新被打开（事件重新被触发）。当一个自动重置事件被触发的时候, 只有一个正在等待该事件的线程会变为可调度状态. 系统并不会保证会调度其中的哪个线程, 剩下的线程将继续等待。所以可以在所有线程返回前再都调用一次setEvent，通知其它线程。

	* bInitialState：事件的初始状态，传入TRUR表示已触发
	* lpName：事件名，传入NULL表示匿名事件

#### 根据事件名获取事件句柄

* 原型：HANDLEOpenEvent(DWORD dwDesiredAccess,BOOL bInheritHandle, LPCTSTR lpName);
* 说明：
	* dwDesiredAccess 访问权限，对事件一般传入EVENT_ALL_ACCESS。详细解释可以查看MSDN文档;
	* bInheritHandle 事件句柄继承性，一般传入TRUE即可;
	* lpName 名称，不同进程中的各线程可以通过名称来确保它们访问同一个事件;

#### 触发事件
* 原型：BOOL SetEvent(HANDLE hEvent);

* 说明：每次触发后，必有一个或多个处于等待状态下的线程变成可调度状态;

#### 重置事件
* 原型：BOOL ResetEvent(HANDL EhEvent);
* 说明：使事件变为未触发状态;

#### 销毁事件
事件是内核对象，因此使用CloseHandle()就可以完成清理与销毁了

### 例程 
~~~ C++
	#include <stdio.h>
	#include <process.h>
	#include <windows.h>
	long g_nNum;
	unsigned int __stdcall Fun(void *pPM);
	const int THREAD_NUM = 10;
	//事件与关键段
	HANDLE  g_hThreadEvent;
	CRITICAL_SECTION g_csThreadCode;
	int main()
	{
		printf("     经典线程同步 事件Event\n");
		printf(" -- by MoreWindows( http://blog.csdn.net/MoreWindows ) --\n\n");
		//初始化事件和关键段 自动置位,初始无触发的匿名事件
		g_hThreadEvent = CreateEvent(NULL, FALSE, FALSE, NULL); 
		InitializeCriticalSection(&g_csThreadCode);
	 
		HANDLE  handle[THREAD_NUM];	
		g_nNum = 0;
		int i = 0;
		while (i < THREAD_NUM) 
		{
			handle[i] = (HANDLE)_beginthreadex(NULL, 0, Fun, &i, 0, NULL);
			WaitForSingleObject(g_hThreadEvent, INFINITE); //等待事件被触发
			i++;
		}
		WaitForMultipleObjects(THREAD_NUM, handle, TRUE, INFINITE);
	 
		//销毁事件和关键段
		CloseHandle(g_hThreadEvent);
		DeleteCriticalSection(&g_csThreadCode);
		return 0;
	}
	unsigned int __stdcall Fun(void *pPM)
	{
		int nThreadNum = *(int *)pPM; 
		SetEvent(g_hThreadEvent); //触发事件
		
		Sleep(50);//some work should to do
		
		EnterCriticalSection(&g_csThreadCode);
		g_nNum++;
		Sleep(0);//some work should to do
		printf("线程编号为%d  全局资源值为%d\n", nThreadNum, g_nNum); 
		LeaveCriticalSection(&g_csThreadCode);
		return 0;
	}
~~~

执行结果如下:

![](http://60.205.3.9/img/Event_1.PNG)

线程编号的输出没有重复，说明主线程与子线程达到了同步。

### 参考资料

https://blog.csdn.net/zhimeng567/article/details/78267832