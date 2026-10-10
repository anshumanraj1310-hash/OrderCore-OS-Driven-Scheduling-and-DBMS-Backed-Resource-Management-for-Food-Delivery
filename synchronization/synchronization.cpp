#include <iostream>
#include <mutex>
#include "synchronization.h"

using namespace std;

mutex orderMutex;

void processOrder(int orderId)
{
    orderMutex.lock();

    cout << "Processing Order " << orderId << endl;
    cout << "Order " << orderId << " is using the shared resource." << endl;

    orderMutex.unlock();
}