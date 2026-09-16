#include <iostream>
#include "scheduler.h"

using namespace std;

void fcfs(Order orders[], int n)
{
    int currentTime = 0;

    for (int i = 0; i < n; i++)
    {
        // If the CPU is free before the order arrives
        if (currentTime < orders[i].arrivalTime)
        {
            currentTime = orders[i].arrivalTime;
        }

        // Completion Time
        currentTime = currentTime + orders[i].prepTime;
        orders[i].completionTime = currentTime;

        // Turnaround Time
        orders[i].turnaroundTime =
            orders[i].completionTime - orders[i].arrivalTime;

        // Waiting Time
        orders[i].waitingTime =
            orders[i].turnaroundTime - orders[i].prepTime;
    }
}