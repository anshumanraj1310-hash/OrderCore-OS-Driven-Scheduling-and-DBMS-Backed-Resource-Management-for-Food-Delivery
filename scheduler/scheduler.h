#ifndef SCHEDULER_H
#define SCHEDULER_H

struct Order
{
    int id;
    int arrivalTime;
    int prepTime;
    int priority;
    int completionTime;
    int waitingTime;
    int turnaroundTime;
};

void fcfs(Order orders[], int n);

#endif