---
layout: 多进程
title: POSIX进程间通信（一）__信号
date: 2020-08-24 21:16:24
tags:
    - 多线程
---

> 本文完全翻译自 mij.oltrelinux.com/devel/unixprg/


## UNIX编程案例

这篇文章是为了那些没有时间（或者太懒）去阅读大量资料的人准备的。同时，这也是一个非常好的Unix编程基础概念以及UNIX IPC（Inter-Process communication 进程间通信）导引。这篇文章囊括了非常多实用并且新颖的UNIX编程主题。为了进一步阐述主题，每个主题都有一个或多个示例代码。当然，当你需要了解完整的细节的时候，完全的阅读文章内容是必要的。尽管互联网在特定的种类上提供了种类繁多并琐碎的例子，这篇文章还是试图总结关于通用主题最详尽的信息。

### 主题组织

这篇文章是按主题来组织的，一个段落一个主题，每个段落有它的注解、总结以及一些源码，注解由一些理论的简短介绍以及unix如何实现的方式组成。注解不是为了那些已经大致知道自己需要搜索什么的人去阅读的，他们可以去看总结：列出了关键的方面。POSIX的一致性在这之中起到了很大的作用。对于每一个主题，都会用纯文本或者html去展示示例。这些例子可以在大多数操作系统上编译。
* 纯文本示例下载地址：[http://mij.oltrelinux.com/devel/unixprg/mij-unixprg-srcs.zip](http://mij.oltrelinux.com/devel/unixprg/mij-unixprg-srcs.zip)
* HTML示例下载地址 ：[http://mij.oltrelinux.com/devel/unixprg/mij-unixprg-htmlsrcs.zip](http://mij.oltrelinux.com/devel/unixprg/mij-unixprg-htmlsrcs.zip)

### 源码以及本文使用方法
此文中的每个源码，除非另有说明，都是本人原创、编写并且经过测试的。这些源码都是开源的。如果你明显的去使用它们，我希望你能注明出处。关于这篇文章剩余的内容，请不要抄袭。
如果你觉得这篇文章有用的话，可以在你的web页面中的某处地方附上本文连接。这将使本文更容易被其他人通过搜索引擎范文到。欢迎任何不同意见或反馈。请进入右上角的contacts页面反馈。
非常感谢Roberto Farina对我的这项工作给予的莫大鼓励和机会，尽管在大学有许多令人窒息的事情去做。

## 进程间通信/UNIX IPC 编程

### 信号
* kill
* raise
* signal

#### 注解：
信号是一种非常重要的消息，进程A发送给进程B一个信号，如果进程B将该信号与一个handler联系在一起，那么收到信号的时候将会中断程序执行，然后处理handler中代码。
最初，信号是一个一元值（收到或者没收到，就像收到短信时的哔哔声）：当一个程序收到信号时，它总是做出同样的反馈（历史上是中断的功能，这也解释了发送信号的函数名为什么叫kill），现在信号已经有字段类型了（类似不同频率的哔哔声）：当一个程序收到信号，它依赖于信号类型给出不同的反馈。信号是int类型的。一些值已经依照惯例标准化了，并和一些符号名联系在一起：一个常见的例子（15，TERM）和（20，CHLD）。完整的列表定义在signal.h里。
进程使用kill函数发送信号，一个进程可以使用signal函数把一个处理函数和一个特定信号联系在一起。
信号的分发是操作系统控制的，一个进程可以发送给另一个进程信号，如果他们属于同一个用户。属于超级用户的进程可以给任何进程发信号。信号也经常是由操作系统本身发送的，比如杀死一个进程当他发生内存越界时。对于其中的某些信号，操作系统禁止定制信号处理函数：SIGSTOP和SIGKILL总是可以让分别让进程停止或退出。两个标准的处理函数在C标准库中定义：SIG_DFL 使进程终止，SIG_IGN 使信号被忽略。当一个处理一个信号时，如果有多个信号到达，它不会被打断。
最后一点：信号不是队列，为了通知信号，操作系统为每个进程保存一个位掩码，当操作系统收到信号n，第n个位掩码就被设置。当处理函数结束时，它被重置为0.因此，如果进程在其它同类型的信号到达前没有被调度执行，只有最后一个信号会通知到进程，其它将被丢弃。

### 总结：
* 头文件 signal.h
* 类型 ：pid_t,sig_t
* 函数
	1. void signal(int sig_type, void (*sig_handler)(int signal_type))
		信号类型是信号的值或者信号的名字，在signal.h中定义。sig_handle是一个带一个int类型参数的函数指针，这个函数将在进程中运行当被一个特定的信号触发的时候。
	2. int kill(pid_t dest_pid, int sig_type)
		发送一个类型为sig_type的信号给PID为dest_pid的运行进程，特别地，当dest_pid为0或-1时，分别发送kill()给与发送方同一组地所有进程，和系统中运行地所有进程（仅超级账户生效）
	3. void raise(int sig_type)
		发送一个sig_type类型地信号给自己
* 其它
	1. 信号只在以下情况下在进程间传递
		* 涉及进程是同一用户运行的
		* 把进程提升为超级用户运行
	2. 进程不是队列
	3. 处理函数“终止进程”（SIG_DFL）和“忽略信号”（SIG_IGN）已经在signal.h中定义

### 例子
处理来自系统的信号。这个例子实现了状态为退出的死亡子进程队列的清除问题，无论什么时候一个子进程改变了它的状态，父进程将会收到一个来自操作系统的信号“SIGCHLD”，一个SIGCHLD处理函数可以和这个信号联系在一起，对于这个过程有两个需要注意的地方
1. 信号处理函数可以捕获所有死亡的子进程，或者没有捕获完全。随机序列延迟forks是导致信号重叠的主要原因。
2. 信号处理函数 (child_handler()) 的触发使进程回到运行状态，在这种情况下，它可以在终端sleep（）函数在程序块结束前

~~~
/*
 *  sig_purgechilds.c
 *  
 *  The parent process pulls a child exit status whenever the OS notifies
 *  a child status change.
 *
 *  Created by Mij <mij@bitchx.it> on 04/01/05.
 *  Original source file available at http://mij.oltrelinux.com/devel/unixprg/
 *
 */

/* for printf() and fgetc() */
#include <stdio.h>
/* for fork() */
#include <sys/types.h>
#include <unistd.h>
/* for srandom() and random() */
#include <stdlib.h>
/* for time() [seeding srandom()] */
#include <time.h>
/* for waitpid() */
#include <sys/wait.h>
/* for signal(), kill() and raise() */
#include <signal.h>

/* how many childs to raise */
#define NUM_PROCS   5


/* handler prototype for SIGCHLD */
void child_handler(int);

int main(int argc, char *argv[])
{
    int i, exit_status;
    
    /* 当收到SIGCHLD信号时，执行child_handler函数 */
    signal(SIGCHLD, &child_handler);

    /* 初始化随机数 */
    srandom(time(NULL));
    
    printf("Try to issue a \'ps\' while the process is running...\n");
                                                                                                                                                                                                                                     
    /* produce NUM_PROCS childs */
    for (i = 0; i < NUM_PROCS; i++) {
        if (! fork()) {
            /* 子进程 */
            
            /* 选择一个随机的退出状态值 */
            exit_status = (int)(random() % 100);
            printf(" -> New child %d, will exit with %d.\n", (int)getpid(), exit_status);
            
            /* 试图避免信号重叠的情况 */
            sleep((unsigned int)(random() % 3));

            exit(exit_status);
        } 
        
        /* 父进程 */
        sleep((unsigned int)(random() % 2));
    }

    /* checkpoint */
    printf("parent: done with fork()ing.\n");

    /* 为什么这个和sleep（20）不等? */
    for (i = 0; i < 10; i++) {
        sleep(1);
    }
    /* 所有子进程应该都已结束 */
    printf("I did not purge all the childs. Timeout; exiting.\n");
    
    /* 给自己发送退出信号 */
    kill(getpid(), 15);

    return 0;
}


/* handler definition for SIGCHLD */
void child_handler(int sig_type)
{
    int child_status;
    pid_t child;
    static int call_num = 0;

    /* 获取子进程的退出状态 */
    child = waitpid(0, &child_status, 0);
    
    printf("<-  Child %d exited with status %d.\n", child, WEXITSTATUS(child_status)); 
    
    /* 是否所有进程都已结束? */
    if (++call_num >= NUM_PROCS) {
        printf("I got all the childs this time. Going to exit.\n");
        exit (0);
    }
    
    return;
}

~~~