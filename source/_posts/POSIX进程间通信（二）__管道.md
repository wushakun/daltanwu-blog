---
layout: 多进程
title: POSIX进程间通信（二）__管道
date: 2020-08-24 21:16:24
tags:
    - 多线程
---

> 本文完全翻译自 mij.oltrelinux.com/devel/unixprg/


## 管道
* pipe

### 注释
管道是一种单向的发送数据的方式。在Unix系统中，它是由几个文件描述符实现的，第一个写的可以被第二个读，使用FIFO（先入先出的方式）。管道是一种最早也是最快的应用于进程间通信的方法。一般一个进程会创建两个管道X 和 Y，然后创建子进程，子进程会继承这些数据。父进程通过X_w（X管道的写描述符）给子进程发信号，自己成通过X_r收信号。同理，子进程发送给父进程消息通过Y_w，父进程通过Y_r收消息。使用同一个管道去实现双向通信会带来混乱，所以正确的实现双向通信只要创建两个管道（P1到P2和P2到P1）就可以。因此，很明显n个进程通信需要n（n-1）个管道。
管道的原子性操作时通过操作系统来保证的。如果一条消息的长度小于一个阈值（由PIPE_BUF 宏定义），如果这个消息和你有关系，那么或许管道对于你的方案不是一个很好的编程选择。
当两个管端（读端或者写端）中的其中一个关闭时，那这个管道就变成了断裂管道，对断裂管道的写入操作是不被操作系统允许的。在这样的情况下，进程会发送一个SIGPIPE信号。从断裂管道读到的消息永远返回的是0字节。
这通常用于通知一端进程对话已结束。

### 总结
* 头文件 #include<unistd.h>
* 函数 int pipe(int *fd_couple)
	创建一个管道保存它的文件句柄，fd_couple[0]（读端），fd_couple[1]（写端），当创建发生错误时返回-1，否则为0
* 另外需要知道的事
	* 管道是单向的
	* 只要消息小于PIPE_BUF 字节，原子性就能够保证
	* 一半开放的管道叫做断裂管道，对它的写入会造成写入错误，对它的读取会返回0字节

### 例程
一系列进程之间传递消息。每个进程由他们自己的管道（一对文件描述符），当进程i想要发消息给进程j，它写入进程j的管道的写端。每个进程将从它自己的管道的读端收到消息。这是一个简化的例子，进程仅读取他们收到的前两个字节，如果需要完全读取的解决方案可以在select()函数的帮助下实现
```

/*
 *  pipes.c
 *  
 *  一系列进程使用管道随机的给对方发送消息
 *
 *
 *  Mij <mij@bitchx.it> 创建于 05/01/05.
 *  源码在这里： http://mij.oltrelinux.com/devel/unixprg/
 *
 */

/* ... */
#include <stdio.h>
/* 用于读和写 */
#include <sys/types.h>
#include <sys/uio.h>
/* 用于字符串处理 */
#include <string.h>
/* 用于管道 */
#include <unistd.h>
/* 用于 random() */
#include <stdlib.h>
/* 用于 time() [seeding srandom()] */
#include <time.h>


#define PROCS_NUM               15          /* 1 < 涉及进程数 <= 255 */
#define MAX_PAYLOAD_LENGTH      50          /* 数据长度 */
#define DEAD_PROC               -1          /* 使用一个值标记死亡文件描述符 */


        /*      ***                     数据类型         ***     */
/* 进程地址 */
typedef char proc_addr;

/* 消息体 */
struct message_s {
    proc_addr src_id;
    short int length;
    char *payload;
};


        /*      ***                     函数原型         ***     */
/* 发送消息给ID为dest的进程 */
int send_proc_message(proc_addr dest, char *message);
/* 从进程的接收端队列中读取一条消息 */
int receive_proc_message(struct message_s *msg);
/* 标记进程关闭 */
void mark_proc_closed(proc_addr process);


        /*              ***             全局变量         ***     */
proc_addr my_address;                   /* 保存进程ID */
int proc_pipes[PROCS_NUM][2];           /* 保存涉及的所有进程的管道 */


int main(int argc, char *argv[])
{
    pid_t child_pid;
    pid_t my_children[PROCS_NUM];               /* 子进程的pid */
    int i, ret;
    char msg_text[MAX_PAYLOAD_LENGTH];       /* 将要发送的消息的载荷信息 */
    proc_addr msg_recipient;                    
    struct message_s msg;
    
    
    
    /* 给自己创建管道（父进程）*/
    pipe(proc_pipes[0]);

    /* 初始化管道结构体 */
    for (i = 1; i < PROCS_NUM; i++) {
        /* 给每个进程创建管道 */
        ret = pipe(proc_pipes[i]);
        if (ret) {
            perror("Error creating pipe");
            abort();
        }        
    }
        
    
    /* fork [1..NUM_PROCS] 个子进程. 0 是我自己. */
    for (i = 1; i < PROCS_NUM; i++) {
        /* 设置子进程地址 */
        my_address = my_address + 1;
        
        child_pid = fork();
        if (! child_pid) {
			/* 子进程 */
            sleep(1);

            /* 关闭其它进程管道的读端 */
            for (i = 0; i < PROCS_NUM; i++) {
                if (i != my_address)
                    close(proc_pipes[i][0]);
            }
            
            
            /* 初始化一个随机因子 */
            srandom(time(NULL));

            /* my_address 现在是 my address, 但是被子进程继承后将变成一个常量 */
            /* 给每个进程产生一些消息 */
            while (random() % (2*PROCS_NUM)) {
                /* 交错.. */
                sleep((unsigned int)(random() % 2));
                
                /* 随机选择一个接收者（包括我自己） */
                msg_recipient = (proc_addr)(random() % PROCS_NUM);
                
                /* 准备并发送消息 */
                sprintf(msg_text, "hello from process %u.", (int)my_address);
                ret = send_proc_message(msg_recipient, msg_text);
                if (ret > 0) {
                    /* 信息被正确的发送 */
                    printf("    --> %d: sent message to %u\n", my_address, msg_recipient);
                } else {
                    /* 将要发送信息的子进程不存在 */
                    mark_proc_closed(msg_recipient);
                    printf("    --> %d: recipient %u is no longer available\n", my_address, msg_recipient);
                }
            }
            
            /* 现在，读取我们最初收到的两条消息 */
            for (i = 0; i < 2; i++) {
                ret = receive_proc_message(&msg);
                if (ret < 0) break;
                printf("<--     Process %d, received message from %u: \"%s\".\n", my_address, msg.src_id, msg.payload);
            };
            
            /* 我退出了，使我的管道变成断裂管道 */
            close(proc_pipes[my_address][0]);
            
            printf("# %d: i am exiting.\n", my_address);
            exit(0);
        }
        
        /* 保存子进程pid，用于未来杀掉进程 */
        my_children[my_address] = child_pid;

        /* 父进程。我不再需要管道的读端 */ 
        close(proc_pipes[my_address][0]);
        
        /* this is for making srandom() consistent */
        sleep(1);
    }
    
    /* 期望用户请求终止... */
    printf("Please press ENTER when you like me to flush the children...\n");
    getchar();

    printf("Ok, terminating dandling processes...\n");
    /* stopping freezed children */
    for (i = 1; i < PROCS_NUM; i++) {
        kill(my_children[i], SIGTERM);
    }
    printf("Done. Exiting.\n");
    
    return 0;
}


int send_proc_message(proc_addr dest, char *message)
{
    int ret;
    char *msg = (char *)malloc(sizeof(message) + 2);
    
    
    /* the write should be atomic. Doing our best */
    msg[0] = (char)dest;
    memcpy((void *)&(msg[1]), (void *)message, strlen(message)+1);
    
    /* 发送消息, 包括 "header" 尾部的 '\0' */
    ret = write(proc_pipes[dest][1], msg, strlen(msg)+2);
    free(msg);
    
    return ret;
}


int receive_proc_message(struct message_s *msg)
{
    char c = 'x';
    char temp_string[MAX_PAYLOAD_LENGTH];
    int ret, i = 0;

    
    /* 首先获取消息的发送者 */
    ret = read(proc_pipes[my_address][0], &c, 1);
    if (ret == 0) {
        return 0;
    }
    msg->src_id = (proc_addr)c;

    do {
        ret = read(proc_pipes[my_address][0], &c, 1);
        temp_string[i++] = c;
    } while ((ret > 0) && (c != '\0') && (i < MAX_PAYLOAD_LENGTH));

    
    
    if (c == '\0') {
        /* 消息被正确的接收 */
        
        msg->payload = (char *)malloc(strlen(temp_string) + 1);
        strncpy(msg->payload, temp_string, strlen(temp_string) + 1);
        
        return 0;
    }


    return -1;
}


void mark_proc_closed(proc_addr process)
{
    proc_pipes[process][0] = DEAD_PROC;
    proc_pipes[process][1] = DEAD_PROC;
}

```
	