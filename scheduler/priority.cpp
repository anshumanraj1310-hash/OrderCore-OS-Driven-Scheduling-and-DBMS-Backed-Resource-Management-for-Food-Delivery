#include <iostream>
#include "scheduler.h"

using namespace std;

void priorityScheduling(Order orders[], int n)
{
    int currentTime = 0;
    int completed = 0;

    bool done[100] = {false};
    Order executionOrder[100];

    while (completed < n)
    {
        int selected = -1;

        // Lower priority number means higher priority.
        for (int i = 0; i < n; i++)
        {
            if (!done[i] && orders[i].arrivalTime <= currentTime)
            {
                if (selected == -1 ||
                    orders[i].priority < orders[selected].priority ||
                    (orders[i].priority == orders[selected].priority &&
                     orders[i].arrivalTime < orders[selected].arrivalTime) ||
                    (orders[i].priority == orders[selected].priority &&
                     orders[i].arrivalTime == orders[selected].arrivalTime &&
                     orders[i].id < orders[selected].id))
                {
                    selected = i;
                }
            }
        }

        // Move time forward if no order has arrived yet.
        if (selected == -1)
        {
            int nextArrival = -1;

            for (int i = 0; i < n; i++)
            {
                if (!done[i] &&
                    (nextArrival == -1 ||
                     orders[i].arrivalTime < nextArrival))
                {
                    nextArrival = orders[i].arrivalTime;
                }
            }

            currentTime = nextArrival;
            continue;
        }

        currentTime += orders[selected].prepTime;

        orders[selected].completionTime = currentTime;
        orders[selected].turnaroundTime =
            currentTime - orders[selected].arrivalTime;
        orders[selected].waitingTime =
            orders[selected].turnaroundTime - orders[selected].prepTime;

        executionOrder[completed] = orders[selected];

        done[selected] = true;
        completed++;
    }

    // Return the array in actual execution order.
    for (int i = 0; i < n; i++)
    {
        orders[i] = executionOrder[i];
    }
}